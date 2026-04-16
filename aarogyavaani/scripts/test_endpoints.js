#!/usr/bin/env node
/**
 * AarogyaVaani End-to-End Test Suite
 * Tests all backend endpoints against the deployed Vercel API.
 * 
 * Usage: node scripts/test_endpoints.js [base_url]
 * Default: https://aarogyavaani-api.vercel.app
 */

const BASE = process.argv[2] || 'https://aarogyavaani-api.vercel.app';
const TEST_USER = 'test_user_' + Date.now();

let passed = 0;
let failed = 0;
const results = [];

async function test(name, fn) {
  const start = Date.now();
  try {
    await fn();
    const ms = Date.now() - start;
    passed++;
    results.push({ name, status: 'PASS', ms });
    console.log(`  ✓ ${name} (${ms}ms)`);
  } catch (err) {
    const ms = Date.now() - start;
    failed++;
    results.push({ name, status: 'FAIL', ms, error: err.message });
    console.log(`  ✗ ${name} (${ms}ms) — ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

async function json(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function main() {
  console.log(`\n═══ AarogyaVaani Test Suite ═══`);
  console.log(`Target: ${BASE}\n`);

  // ────── Health Check ──────
  console.log('Health:');
  await test('GET /health returns 200', async () => {
    const { status, data } = await json(`${BASE}/health`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.status === 'ok', `Expected status "ok", got "${data.status}"`);
    assert(data.service === 'aarogyavaani-backend', `Wrong service name: ${data.service}`);
  });

  // ────── Knowledge Query ──────
  console.log('\nKnowledge Query:');
  await test('POST /query_health_knowledge — English diabetes query', async () => {
    const { status, data } = await json(`${BASE}/query_health_knowledge`, {
      method: 'POST',
      body: JSON.stringify({ user_id: TEST_USER, query: 'diabetes diet tips', language: 'en' }),
    });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.status === 'ok', `Status not ok: ${data.status}`);
    assert(data.context && data.context.length > 50, 'Context too short or empty');
    assert(data.knowledge_results.length > 0, 'No knowledge results');
  });

  await test('POST /query_health_knowledge — Hindi query', async () => {
    const { status, data } = await json(`${BASE}/query_health_knowledge`, {
      method: 'POST',
      body: JSON.stringify({ user_id: TEST_USER, query: 'शुगर में क्या खाएं', language: 'hi' }),
    });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.context.length > 50, 'Hindi context too short');
  });

  await test('POST /query_health_knowledge — Ayushman Bharat query', async () => {
    const { status, data } = await json(`${BASE}/query_health_knowledge`, {
      method: 'POST',
      body: JSON.stringify({ user_id: TEST_USER, query: 'ayushman bharat card kaise banaye' }),
    });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.context.includes('Ayushman') || data.context.includes('ayushman') || data.context.includes('आयुष्मान'), 'No Ayushman content in response');
  });

  await test('POST /query_health_knowledge — empty query returns 422', async () => {
    const res = await fetch(`${BASE}/query_health_knowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: TEST_USER, query: '' }),
    });
    // Should be 422 (validation error) or 400
    assert(res.status === 422 || res.status === 400, `Expected 422/400 for empty query, got ${res.status}`);
  });

  // ────── Save Conversation Summary ──────
  console.log('\nConversation Memory:');
  await test('POST /save_conversation_summary — saves successfully', async () => {
    const { status, data } = await json(`${BASE}/save_conversation_summary`, {
      method: 'POST',
      body: JSON.stringify({
        user_id: TEST_USER,
        summary: 'Patient asked about diabetes diet. Advised to eat roti, dal, sabzi. Avoid sugar and fried food. Suggested walking 30 minutes daily.',
        language: 'en',
        conditions: ['diabetes'],
      }),
    });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.status === 'saved' || data.status === 'ok', `Save failed: ${data.status}`);
  });

  // ────── Call History ──────
  console.log('\nCall History:');
  // Wait a moment for Qdrant to index
  await new Promise(r => setTimeout(r, 1500));

  await test('GET /call_history/{user_id} — returns saved call', async () => {
    const { status, data } = await json(`${BASE}/call_history/${TEST_USER}`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.total >= 1, `Expected at least 1 call, got ${data.total}`);
    assert(data.calls[0].summary.includes('diabetes') || data.calls[0].summary.includes('diet'), 'Summary content mismatch');
  });

  await test('GET /call_history/{user_id} — empty user returns empty', async () => {
    const { status, data } = await json(`${BASE}/call_history/nonexistent_user_xyz`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.total === 0, `Expected 0 calls for nonexistent user, got ${data.total}`);
  });

  // ────── Health Report ──────
  console.log('\nHealth Report:');
  await test('GET /health_report/{user_id} — generates report', async () => {
    const { status, data } = await json(`${BASE}/health_report/${TEST_USER}`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.total_calls >= 1, `Expected >= 1 calls in report`);
    assert(data.conditions_tracked.length >= 0, 'conditions_tracked should be array');
    assert(data.recommendations.length > 0, 'Should have recommendations');
    assert(data.report_generated_at, 'Missing report_generated_at');
  });

  // ────── Task Generation ──────
  console.log('\nTask Generation:');
  await test('POST /generate_tasks — extracts tasks from summary', async () => {
    const { status, data } = await json(`${BASE}/generate_tasks`, {
      method: 'POST',
      body: JSON.stringify({
        summary: 'Patient is a 55-year-old male with type 2 diabetes. Blood sugar fasting was 180 mg/dL. Advised to reduce rice intake, walk daily, take metformin regularly, and get HbA1c test done.',
        user_id: TEST_USER,
      }),
    });
    assert(status === 200, `Expected 200, got ${status}`);
    // Tasks may be empty if OpenRouter key isn't set, but endpoint shouldn't crash
    assert(Array.isArray(data.tasks), 'tasks should be an array');
    if (data.tasks.length > 0) {
      assert(data.tasks[0].task, 'Task should have a task field');
      assert(data.tasks[0].priority, 'Task should have a priority field');
    }
  });

  // ────── Vapi Webhook ──────
  console.log('\nVapi Webhook:');
  await test('POST /vapi/webhook — function-call (query_health_knowledge)', async () => {
    const { status, data } = await json(`${BASE}/vapi/webhook`, {
      method: 'POST',
      body: JSON.stringify({
        message: {
          type: 'function-call',
          functionCall: {
            name: 'query_health_knowledge',
            parameters: { user_id: TEST_USER, query: 'pregnancy care' },
          },
        },
      }),
    });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.results && data.results.length > 0, 'Should return results array');
    assert(data.results[0].result.length > 0, 'Result should have content');
  });

  await test('POST /vapi/webhook — function-call (save_conversation_summary)', async () => {
    const { status, data } = await json(`${BASE}/vapi/webhook`, {
      method: 'POST',
      body: JSON.stringify({
        message: {
          type: 'function-call',
          functionCall: {
            name: 'save_conversation_summary',
            parameters: { user_id: TEST_USER, summary: 'Test call about pregnancy care and nutrition.' },
          },
        },
      }),
    });
    assert(status === 200, `Expected 200, got ${status}`);
  });

  await test('POST /vapi/webhook — unknown type returns ok', async () => {
    const { status, data } = await json(`${BASE}/vapi/webhook`, {
      method: 'POST',
      body: JSON.stringify({ message: { type: 'status-update', status: 'in-progress' } }),
    });
    assert(status === 200, `Expected 200, got ${status}`);
  });

  // ────── Error Handling ──────
  console.log('\nError Handling:');
  await test('GET /nonexistent returns 404', async () => {
    const res = await fetch(`${BASE}/nonexistent`);
    assert(res.status === 404, `Expected 404, got ${res.status}`);
  });

  await test('POST /query_health_knowledge — missing body returns 422', async () => {
    const res = await fetch(`${BASE}/query_health_knowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    assert(res.status === 422, `Expected 422 for missing fields, got ${res.status}`);
  });

  // ────── Summary ──────
  console.log(`\n═══ Results ═══`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total:  ${passed + failed}`);

  const avgMs = Math.round(results.reduce((s, r) => s + r.ms, 0) / results.length);
  console.log(`  Avg latency: ${avgMs}ms`);

  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  ✗ ${r.name}: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n  All tests passed! ✓\n');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Test runner crashed:', err);
  process.exit(2);
});
