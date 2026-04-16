#!/usr/bin/env node
/**
 * deploy_vercel.js — Deploy aarogyavaani backend to Vercel via REST API.
 *
 * Usage:  node scripts/deploy_vercel.js
 *
 * Requires Node 18+ (uses built-in fetch).
 * No Vercel CLI needed — talks directly to the Vercel REST API.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Config ──────────────────────────────────────────────────────────────────

const VERCEL_TOKEN = "REMOVED";
const PROJECT_NAME = "aarogyavaani-api";

const ENV_VARS = {
  QDRANT_URL:
    "https://c9e6a936-9c10-4ea9-a6cb-dcfa121f0abb.eu-west-1-0.aws.cloud.qdrant.io",
  QDRANT_API_KEY:
    "REMOVED",
  VAPI_API_KEY: "REMOVED",
  HF_API_URL:
    "https://router.huggingface.co/hf-inference/models/intfloat/multilingual-e5-large-instruct",
  HF_API_TOKEN: "REMOVED",
  HF_API_TOKEN_1: "REMOVED",
  HF_API_TOKEN_2: "REMOVED",
  MISTRAL_API_KEY: "REMOVED",
  COHERE_API_KEY: "REMOVED",
  NVIDIA_API_KEY: "REMOVED",
  OPENROUTER_API_KEY: "REMOVED",
};

const VERCEL_API = "https://api.vercel.com";

// Root of the aarogyavaani project (one level up from scripts/)
const PROJECT_ROOT = path.resolve(__dirname, "..");

// Directories / files to skip
const EXCLUDE = new Set([
  ".env",
  ".env.example",
  "__pycache__",
  ".venv",
  "node_modules",
  "scripts",
  ".vercel",
  ".git",
  ".gitignore",
  "Dockerfile",
  "docker-compose.yml",
  "Procfile",
  "render.yaml",
  "vapi_config",
]);

// ── Helpers ─────────────────────────────────────────────────────────────────

function sha1(buffer) {
  return crypto.createHash("sha1").update(buffer).digest("hex");
}

/** Recursively collect files, returning { relativePath, absolutePath } */
function collectFiles(dir, baseDir = dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const relFromRoot = path.relative(baseDir, fullPath).replace(/\\/g, "/");

    // Check if the top-level segment is excluded
    const topSegment = relFromRoot.split("/")[0];
    if (EXCLUDE.has(topSegment)) continue;

    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath, baseDir));
    } else {
      results.push({ relativePath: relFromRoot, absolutePath: fullPath });
    }
  }
  return results;
}

async function vercelFetch(endpoint, options = {}) {
  const url = `${VERCEL_API}${endpoint}`;
  const headers = {
    Authorization: `Bearer ${VERCEL_TOKEN}`,
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vercel API ${res.status} ${res.statusText} — ${endpoint}\n${text}`);
  }
  return res;
}

// ── Step 1: Upload files ────────────────────────────────────────────────────

async function uploadFile(fileBuf, digest) {
  await vercelFetch("/v2/files", {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "x-vercel-digest": digest,
      "x-vercel-size": String(fileBuf.byteLength),
    },
    body: fileBuf,
  });
}

// ── Step 2: Create deployment ───────────────────────────────────────────────

async function createDeployment(files) {
  const body = {
    name: PROJECT_NAME,
    files,
    projectSettings: {
      framework: null,
      buildCommand: "",
      outputDirectory: "",
    },
    env: ENV_VARS,
    target: "production",
  };

  const res = await vercelFetch("/v13/deployments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return res.json();
}

// ── Step 3: Poll deployment status ──────────────────────────────────────────

async function waitForDeployment(deploymentId) {
  const MAX_WAIT = 5 * 60 * 1000; // 5 minutes
  const POLL_INTERVAL = 5_000;
  const start = Date.now();

  while (Date.now() - start < MAX_WAIT) {
    const res = await vercelFetch(`/v13/deployments/${deploymentId}`);
    const data = await res.json();
    const state = data.readyState || data.state;

    process.stdout.write(`  status: ${state}\r`);

    if (state === "READY") {
      console.log(`\n  Deployment is READY`);
      return data;
    }
    if (state === "ERROR" || state === "CANCELED") {
      console.error(`\n  Deployment failed: ${state}`);
      console.error(JSON.stringify(data, null, 2));
      process.exit(1);
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
  }

  console.error("  Timed out waiting for deployment.");
  process.exit(1);
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Vercel REST API Deploy ===\n");
  console.log(`Project : ${PROJECT_NAME}`);
  console.log(`Root    : ${PROJECT_ROOT}\n`);

  // 1. Collect files
  const fileEntries = collectFiles(PROJECT_ROOT);
  console.log(`Found ${fileEntries.length} files to deploy:`);
  fileEntries.forEach((f) => console.log(`  ${f.relativePath}`));
  console.log();

  // 2. Upload each file
  const deploymentFiles = [];

  for (const entry of fileEntries) {
    const buf = fs.readFileSync(entry.absolutePath);
    const digest = sha1(buf);

    process.stdout.write(`Uploading ${entry.relativePath} (${buf.byteLength} bytes) ... `);

    try {
      await uploadFile(buf, digest);
      console.log("OK");
    } catch (err) {
      // 409 means the file already exists — that's fine
      if (err.message.includes("409")) {
        console.log("already exists");
      } else {
        console.error("FAILED");
        throw err;
      }
    }

    deploymentFiles.push({
      file: entry.relativePath,
      sha: digest,
      size: buf.byteLength,
    });
  }

  console.log(`\nAll ${deploymentFiles.length} files uploaded.\n`);

  // 3. Create deployment
  console.log("Creating deployment...");
  const deployment = await createDeployment(deploymentFiles);

  const deploymentId = deployment.id;
  const deploymentUrl = deployment.url;
  console.log(`  id  : ${deploymentId}`);
  console.log(`  url : https://${deploymentUrl}\n`);

  // 4. Poll until ready
  console.log("Waiting for deployment to become READY...");
  const final = await waitForDeployment(deploymentId);

  console.log(`\n=== Deployed successfully ===`);
  console.log(`  URL        : https://${final.url}`);
  if (final.alias && final.alias.length) {
    console.log(`  Aliases    :`);
    final.alias.forEach((a) => console.log(`    https://${a}`));
  }
  console.log();
}

main().catch((err) => {
  console.error("\nFATAL:", err.message || err);
  process.exit(1);
});
