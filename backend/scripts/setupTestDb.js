const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function run(cmd, opts = {}){
  console.log('$', cmd);
  execSync(cmd, { stdio: 'inherit', ...opts });
}

async function main(){
  const cwd = path.resolve(__dirname, '..');
  // Ensure DATABASE_URL points to test.db in backend
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./test.db';
  const dbPath = path.resolve(cwd, 'test.db');
  console.log('Using DATABASE_URL=', process.env.DATABASE_URL, 'dbPath=', dbPath);

  // If test.db exists, remove it to ensure a clean test database
  try{
    if(fs.existsSync(dbPath)){
      console.log('Removing existing test.db for a clean start');
      fs.unlinkSync(dbPath);
    }
  }catch(e){ console.warn('Could not remove test.db:', e.message); }

  // Generate prisma client for sqlite schema
  run('npx prisma generate --schema=prisma/schema.sqlite.prisma', { cwd });
  // Apply migrations (deploy existing migrations)
  // Use migrate deploy so it works in CI and doesn't prompt
  run('npx prisma migrate deploy --schema=prisma/schema.sqlite.prisma', { cwd });

  // Run seed to populate test data (if seed script exists)
  try{
    if(fs.existsSync(path.join(cwd, 'prisma','seed.js'))){
      console.log('Running seed.js to populate test data');
      run('node prisma/seed.js', { cwd });
    }
  }catch(e){ console.warn('Seed failed:', e.message); }
}

main().catch(err=>{ console.error(err); process.exit(1); });
