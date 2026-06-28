import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 Starting Solas Billing Dev Environment...');

// Start Fastify server
const server = spawn('npm', ['run', 'dev'], {
  cwd: path.join(rootDir, 'apps', 'server'),
  stdio: 'inherit',
  shell: true
});

// Start React/Vite dashboard
const dashboard = spawn('npm', ['run', 'dev'], {
  cwd: path.join(rootDir, 'apps', 'dashboard'),
  stdio: 'inherit',
  shell: true
});

process.on('SIGINT', () => {
  console.log('\nStopping all services...');
  server.kill();
  dashboard.kill();
  process.exit();
});
