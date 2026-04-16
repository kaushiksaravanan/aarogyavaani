/**
 * AarogyaVaani — Document Ingestion via REST APIs
 *
 * Reads .md files from knowledge_base/{hindi,english,kannada}/,
 * chunks them (~500 words), embeds via HuggingFace Inference API
 * (intfloat/multilingual-e5-large-instruct), and upserts into
 * the Qdrant Cloud `health_knowledge_base` collection.
 *
 * Embedding strategy (in order of preference):
 *   1. HF_API_TOKEN set → uses router.huggingface.co Inference API
 *   2. Fallback         → spawns a Python subprocess with sentence-transformers
 *
 * Usage:
 *   node scripts/ingest_via_api.js
 *
 * Environment variables (optional overrides):
 *   HF_API_TOKEN   — HuggingFace API token (enables remote embedding)
 *   QDRANT_URL     — Qdrant Cloud base URL
 *   QDRANT_API_KEY — Qdrant Cloud API key
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Configuration ────────────────────────────────────────────────────

const HF_API_TOKEN = process.env.HF_API_TOKEN || "";
const HF_EMBED_URL =
  "https://router.huggingface.co/hf-inference/models/intfloat/multilingual-e5-large-instruct";

const QDRANT_URL =
  process.env.QDRANT_URL ||
  "https://c9e6a936-9c10-4ea9-a6cb-dcfa121f0abb.eu-west-1-0.aws.cloud.qdrant.io:6333";
const QDRANT_API_KEY =
  process.env.QDRANT_API_KEY ||
  "REMOVED";

const COLLECTION_NAME = "health_knowledge_base";
const VECTOR_SIZE = 1024;
const CHUNK_TARGET_WORDS = 500;
const EMBED_DELAY_MS = 500; // rate-limit guard for HF API
const QDRANT_BATCH_SIZE = 50;

const LANG_MAP = { hindi: "hi", english: "en", kannada: "kn" };

const KB_ROOT = path.resolve(__dirname, "..", "knowledge_base");

// ── Helpers ──────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * L2-normalise a vector in place and return it.
 */
function l2Normalise(vec) {
  let norm = 0;
  for (let i = 0; i < vec.length; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm);
  if (norm === 0) return vec;
  for (let i = 0; i < vec.length; i++) vec[i] /= norm;
  return vec;
}

// ── Markdown discovery ───────────────────────────────────────────────

function discoverFiles() {
  const files = [];
  for (const [folder, langCode] of Object.entries(LANG_MAP)) {
    const dir = path.join(KB_ROOT, folder);
    if (!fs.existsSync(dir)) {
      console.warn(`  Warning: directory not found — ${dir}  (skipping)`);
      continue;
    }
    const entries = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".md"))
      .sort();
    for (const entry of entries) {
      files.push({
        filePath: path.join(dir, entry),
        language: langCode,
        file: entry,
      });
    }
  }
  return files;
}

// ── Chunking ─────────────────────────────────────────────────────────

function chunkText(text, targetWords = CHUNK_TARGET_WORDS) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks = [];
  let current = [];
  let currentWords = 0;

  for (const para of paragraphs) {
    const paraWords = para.split(/\s+/).length;

    if (currentWords + paraWords <= targetWords) {
      current.push(para);
      currentWords += paraWords;
      continue;
    }

    // Flush accumulated paragraphs
    if (current.length) {
      chunks.push(current.join("\n\n"));
      current = [];
      currentWords = 0;
    }

    // Oversized single paragraph — split by word count
    if (paraWords > targetWords) {
      const words = para.split(/\s+/);
      for (let i = 0; i < words.length; i += targetWords) {
        chunks.push(words.slice(i, i + targetWords).join(" "));
      }
    } else {
      current.push(para);
      currentWords = paraWords;
    }
  }

  if (current.length) {
    chunks.push(current.join("\n\n"));
  }

  return chunks.filter((c) => c.trim());
}

// ── Title extraction ─────────────────────────────────────────────────

function extractTitle(text, fileName) {
  const match = text.match(/^#\s+(.+)$/m);
  if (match) return match[1].trim();
  return fileName
    .replace(/\.md$/, "")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Embedding: HuggingFace Inference API ─────────────────────────────

async function embedTextViaAPI(text) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${HF_API_TOKEN}`,
  };

  const body = JSON.stringify({
    inputs: `passage: ${text}`,
    options: { wait_for_model: true },
  });

  const res = await fetch(HF_EMBED_URL, { method: "POST", headers, body });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HF API ${res.status}: ${errText}`);
  }

  const json = await res.json();
  let vector = Array.isArray(json[0]) ? json[0] : json;

  if (!Array.isArray(vector) || vector.length !== VECTOR_SIZE) {
    throw new Error(
      `Unexpected embedding shape: length ${
        Array.isArray(vector) ? vector.length : typeof vector
      }, expected ${VECTOR_SIZE}`
    );
  }

  return l2Normalise(vector);
}

// ── Embedding: Local Python subprocess (sentence-transformers) ───────

/**
 * Embeds all texts in a single Python subprocess call.
 * Returns an array of 1024-dim normalised vectors.
 */
function embedBatchViaPython(texts) {
  // Write texts to a temp JSON file (avoids shell quoting issues with
  // multilingual content).
  const tmpIn = path.join(__dirname, "_embed_input.json");
  const tmpOut = path.join(__dirname, "_embed_output.json");

  fs.writeFileSync(tmpIn, JSON.stringify(texts), "utf-8");

  const pyCode = `
import json, sys
from sentence_transformers import SentenceTransformer

with open(r"${tmpIn.replace(/\\/g, "\\\\")}", "r", encoding="utf-8") as f:
    texts = json.load(f)

model = SentenceTransformer("intfloat/multilingual-e5-large-instruct")
prefixed = ["passage: " + t for t in texts]
embeddings = model.encode(prefixed, normalize_embeddings=True, show_progress_bar=False)
result = embeddings.tolist()

with open(r"${tmpOut.replace(/\\/g, "\\\\")}", "w", encoding="utf-8") as f:
    json.dump(result, f)

print(f"Embedded {len(texts)} texts", file=sys.stderr)
`.trim();

  try {
    execFileSync("python", ["-c", pyCode], {
      stdio: ["pipe", "pipe", "inherit"],
      timeout: 600_000, // 10 min for model load + embedding
      maxBuffer: 100 * 1024 * 1024, // 100 MB
    });

    const raw = fs.readFileSync(tmpOut, "utf-8");
    const vectors = JSON.parse(raw);

    // Validate
    if (!Array.isArray(vectors) || vectors.length !== texts.length) {
      throw new Error(
        `Python returned ${vectors?.length} vectors for ${texts.length} texts`
      );
    }

    return vectors;
  } finally {
    // Clean up temp files
    try { fs.unlinkSync(tmpIn); } catch {}
    try { fs.unlinkSync(tmpOut); } catch {}
  }
}

// ── Qdrant REST helpers ──────────────────────────────────────────────

async function qdrantUpsert(points) {
  const url = `${QDRANT_URL}/collections/${COLLECTION_NAME}/points`;
  const headers = {
    "Content-Type": "application/json",
    "api-key": QDRANT_API_KEY,
  };

  const res = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify({ points }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Qdrant upsert ${res.status}: ${errText}`);
  }

  return res.json();
}

async function qdrantCollectionInfo() {
  const url = `${QDRANT_URL}/collections/${COLLECTION_NAME}`;
  const headers = { "api-key": QDRANT_API_KEY };
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Qdrant info ${res.status}: ${errText}`);
  }
  return res.json();
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  const SEP = "=".repeat(60);
  console.log(SEP);
  console.log("  AarogyaVaani — Document Ingestion (Node.js / REST APIs)");
  console.log(SEP);

  const useAPI = !!HF_API_TOKEN;
  console.log(
    `\nEmbedding strategy: ${
      useAPI
        ? "HuggingFace Inference API (HF_API_TOKEN set)"
        : "Local Python subprocess (sentence-transformers)"
    }`
  );

  // 1. Discover files
  console.log(`\nScanning: ${KB_ROOT}`);
  const files = discoverFiles();
  if (!files.length) {
    console.log("No .md files found. Nothing to ingest.");
    return;
  }
  console.log(
    `Found ${files.length} file(s) across [${Object.keys(LANG_MAP).join(", ")}]\n`
  );

  // 2. Verify Qdrant collection exists
  try {
    const info = await qdrantCollectionInfo();
    console.log(`Connected to Qdrant — collection "${COLLECTION_NAME}" exists`);
    console.log(
      `  Current points: ${info.result?.points_count ?? "unknown"}\n`
    );
  } catch (err) {
    console.error(
      `ERROR: Cannot reach Qdrant or collection missing.\n  ${err.message}`
    );
    process.exit(1);
  }

  // 3. Collect all chunks first
  console.log("Chunking documents...");
  const allChunks = []; // {text, title, language, file}

  for (const { filePath, language, file } of files) {
    const raw = fs.readFileSync(filePath, "utf-8");
    const title = extractTitle(raw, file);
    const chunks = chunkText(raw);

    console.log(
      `  ${file}  (${language})  → ${chunks.length} chunk(s)`
    );

    for (const chunkContent of chunks) {
      allChunks.push({ text: chunkContent, title, language, file });
    }
  }

  console.log(`\nTotal chunks to embed: ${allChunks.length}\n`);

  if (!allChunks.length) {
    console.log("No chunks produced. Nothing to ingest.");
    return;
  }

  // 4. Embed
  let vectors;

  if (useAPI) {
    // ── HF Inference API: embed one at a time with rate limiting ──
    console.log("Embedding via HuggingFace Inference API...");
    vectors = [];
    for (let i = 0; i < allChunks.length; i++) {
      process.stdout.write(`  Embedding chunk ${i + 1}/${allChunks.length}\r`);
      vectors.push(await embedTextViaAPI(allChunks[i].text));
      if (i < allChunks.length - 1) await sleep(EMBED_DELAY_MS);
    }
    console.log(`  Embedded ${vectors.length} chunks via API.          `);
  } else {
    // ── Local Python: batch-embed all chunks at once ──
    console.log(
      "Embedding via local Python (sentence-transformers)...\n" +
        "  (First run downloads the model — this may take a few minutes)\n"
    );
    const texts = allChunks.map((c) => c.text);
    vectors = embedBatchViaPython(texts);
    console.log(`  Embedded ${vectors.length} chunks locally.`);
  }

  // 5. Upsert to Qdrant in batches
  console.log("\nUpserting to Qdrant...");
  let batchBuffer = [];
  let upserted = 0;

  for (let i = 0; i < allChunks.length; i++) {
    const { text, title, language, file } = allChunks[i];
    const vector = vectors[i];

    batchBuffer.push({
      id: crypto.randomUUID(),
      vector,
      payload: { title, content: text, language, source: "local", file },
    });

    if (batchBuffer.length >= QDRANT_BATCH_SIZE) {
      await qdrantUpsert(batchBuffer);
      upserted += batchBuffer.length;
      console.log(
        `  Upserted ${upserted}/${allChunks.length} points...`
      );
      batchBuffer = [];
    }
  }

  if (batchBuffer.length) {
    await qdrantUpsert(batchBuffer);
    upserted += batchBuffer.length;
    console.log(`  Upserted ${upserted}/${allChunks.length} points (final batch).`);
    batchBuffer = [];
  }

  // 6. Summary
  const info = await qdrantCollectionInfo();
  console.log("\n" + SEP);
  console.log("  Ingestion complete.");
  console.log(`  Files processed      : ${files.length}`);
  console.log(`  Chunks created       : ${allChunks.length}`);
  console.log(
    `  Points in collection : ${info.result?.points_count ?? "unknown"}`
  );
  console.log(SEP);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
