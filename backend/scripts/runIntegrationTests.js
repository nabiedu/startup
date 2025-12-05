const { spawnSync } = require('child_process');
const path = require('path');

// Set test DB env and run setup, then run jest in the same env
const cwd = path.resolve(__dirname, '..');
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./test.db';
console.log('Running integration tests with DATABASE_URL=' + process.env.DATABASE_URL);

// run setupTestDb.js first
const setup = spawnSync(process.execPath, [require.resolve('./setupTestDb.js')], { cwd, stdio: 'inherit', env: process.env });
if(setup.status !== 0){ process.exit(setup.status || 1); }

// run jest for integration tests
const jest = spawnSync(process.execPath, [
  require.resolve('jest/bin/jest'),
  '--runInBand',
  '--testPathPattern=tests/integration'
], { cwd, stdio: 'inherit', env: process.env });

process.exit(jest.status);

// cleanup test.db after tests
try{
  const fs = require('fs');
  const dbPath = require('path').resolve(cwd, 'test.db');
  if(fs.existsSync(dbPath)){
    try{ fs.unlinkSync(dbPath); console.log('Removed test.db'); }catch(e){ console.warn('Failed to remove test.db:', e.message); }
  }
}catch(e){ /* noop */ }
