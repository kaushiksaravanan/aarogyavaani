const { execSync } = require('child_process');
const path = require('path');

const TOKEN = process.env.VERCEL_TOKEN || 'REMOVED';

const ROOT = path.resolve(__dirname, '..');
const BACKEND = path.join(ROOT, 'backend');

function run(cmd, cwd = ROOT, env = {}) {
  console.log(`\n> ${cmd}`);
  try {
    const out = execSync(cmd, {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 120000,
      env: { ...process.env, ...env },
    });
    console.log(out);
    return out.trim();
  } catch (e) {
    console.error(e.stderr || e.message);
    throw e;
  }
}

async function main() {
  console.log('=== LaunchForge Vercel Deployment ===\n');

  // Step 1: Deploy backend first (we need its URL for frontend build)
  console.log('[1/4] Deploying backend (FastAPI)...');
  const backendUrl = run(
    `npx vercel deploy --yes --token=${TOKEN} --name=launchforge-api --prod`,
    BACKEND
  );
  console.log(`Backend URL: ${backendUrl}`);

  // Step 2: Rebuild frontend with backend URL baked in (Vite needs it at build time)
  console.log('[2/4] Building frontend with VITE_API_BASE_URL...');
  run('npm run build', ROOT, { VITE_API_BASE_URL: backendUrl });

  // Step 3: Deploy frontend
  console.log('[3/4] Deploying frontend (Vite SPA)...');
  const frontendUrl = run(
    `npx vercel deploy --yes --token=${TOKEN} --name=launchforge-app --prod`,
    ROOT
  );
  console.log(`Frontend URL: ${frontendUrl}`);

  // Step 4: Summary
  console.log('\n=== Deployment Complete ===');
  console.log(`Frontend: ${frontendUrl}`);
  console.log(`Backend:  ${backendUrl}`);
  console.log(`\nBackend health: ${backendUrl}/health`);
  console.log(`Frontend app:   ${frontendUrl}`);
}

main().catch((e) => {
  console.error('Deployment failed:', e.message);
  process.exit(1);
});
