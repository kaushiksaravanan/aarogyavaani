import { SecureStorage, getLocalEncryptionPassphrase } from './crypto'

const STORAGE_KEY = 'private_documents_v1'

function hashToken(token) {
  let hash = 2166136261
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash >>> 0)
}

function normalizeVector(vector) {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1
  return vector.map(value => value / magnitude)
}

function embedText(text, dimensions = 64) {
  const vector = new Array(dimensions).fill(0)
  for (const token of tokenize(text)) {
    const bucket = hashToken(token) % dimensions
    const signed = hashToken(`${token}_sign`) % 2 === 0 ? 1 : -1
    vector[bucket] += signed * (token.length > 6 ? 1.5 : 1)
  }
  return normalizeVector(vector)
}

function cosineSimilarity(a = [], b = []) {
  const length = Math.min(a.length, b.length)
  let total = 0
  for (let index = 0; index < length; index += 1) {
    total += (a[index] || 0) * (b[index] || 0)
  }
  return total
}

function cleanText(text) {
  return (text || '').replace(/\s+/g, ' ').trim()
}

function tokenize(text) {
  return cleanText(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2)
}

function chunkText(text, maxChars = 500) {
  const cleaned = cleanText(text)
  if (!cleaned) return []

  const sentences = cleaned.split(/(?<=[.!?])\s+/)
  const chunks = []
  let current = ''

  for (const sentence of sentences) {
    const next = current ? `${current} ${sentence}` : sentence
    if (next.length <= maxChars) {
      current = next
      continue
    }
    if (current) chunks.push(current)
    current = sentence.length <= maxChars ? sentence : sentence.slice(0, maxChars)
  }

  if (current) chunks.push(current)
  return chunks.slice(0, 24)
}

function extractKeywords(text, limit = 24) {
  const counts = new Map()
  for (const token of tokenize(text)) {
    counts.set(token, (counts.get(token) || 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([token]) => token)
}

function scoreChunk(query, chunk) {
  const queryTokens = tokenize(query)
  if (!queryTokens.length) return 0

  const haystack = `${chunk.text} ${(chunk.keywords || []).join(' ')}`.toLowerCase()
  let score = 0
  for (const token of queryTokens) {
    if (haystack.includes(token)) score += token.length > 5 ? 2 : 1
  }
  return score
}

function buildPassphrase(userId) {
  return getLocalEncryptionPassphrase(userId, 'private-docs')
}

export async function getPrivateDocuments(userId) {
  if (!userId) return []
  const docs = await SecureStorage.getItem(STORAGE_KEY, buildPassphrase(userId))
  return Array.isArray(docs) ? docs : []
}

async function savePrivateDocuments(userId, docs) {
  await SecureStorage.setItem(STORAGE_KEY, docs, buildPassphrase(userId))
}

export async function addPrivateDocument({ userId, fileName, text, source = 'manual', metadata = {} }) {
  if (!userId) throw new Error('User ID required')

  const docs = await getPrivateDocuments(userId)
  const chunks = chunkText(text).map((chunkTextValue, index) => ({
    id: `${Date.now()}_${index}`,
    text: chunkTextValue,
    keywords: extractKeywords(chunkTextValue, 16),
    vector: embedText(chunkTextValue),
  }))

  const doc = {
    id: `private_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    fileName,
    source,
    summary: cleanText(text).slice(0, 240),
    text: cleanText(text),
    chunks,
    keywords: extractKeywords(text),
    vector: embedText(text),
    metadata,
    savedAt: new Date().toISOString(),
  }

  await savePrivateDocuments(userId, [doc, ...docs])
  return doc
}

export async function removePrivateDocument(userId, docId) {
  const docs = await getPrivateDocuments(userId)
  const next = docs.filter(doc => doc.id !== docId)
  await savePrivateDocuments(userId, next)
  return next
}

export async function queryPrivateDocuments(userId, query, limit = 4) {
  const docs = await getPrivateDocuments(userId)
  const queryVector = embedText(query)
  const scored = docs.flatMap(doc => {
    const chunks = doc.chunks?.length ? doc.chunks : [{ id: doc.id, text: doc.text, keywords: doc.keywords || [], vector: doc.vector || embedText(doc.text) }]
    return chunks.map(chunk => ({
      docId: doc.id,
      fileName: doc.fileName,
      savedAt: doc.savedAt,
      summary: doc.summary,
      text: chunk.text,
      keywords: chunk.keywords || [],
      lexicalScore: scoreChunk(query, chunk),
      vectorScore: cosineSimilarity(queryVector, chunk.vector || embedText(chunk.text)),
    }))
  })

  return scored
    .map(item => ({ ...item, score: item.lexicalScore + item.vectorScore * 4 }))
    .filter(item => item.score > 0.2)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export function synthesizePrivateDocumentAnswer(query, matches) {
  if (!matches.length) {
    return {
      found: false,
      answer: 'I did not find a strong match in your private on-device documents.',
      references: [],
    }
  }

  const references = matches.map(match => ({
    fileName: match.fileName,
    savedAt: match.savedAt,
    excerpt: match.text.slice(0, 220),
  }))

  const stitched = matches
    .map(match => `${match.fileName}: ${match.text}`)
    .join(' ')
    .slice(0, 900)

  return {
    found: true,
    answer: `Based on your private on-device documents, I found relevant information for "${query}": ${stitched}`,
    references,
  }
}
