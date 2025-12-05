const fs = require('fs');
const path = require('path');

module.exports = async () => {
  // ensure clean test.db before tests
  const db = path.resolve(__dirname, '..', 'test.db');
  try{
    if (fs.existsSync(db)) fs.unlinkSync(db);
  }catch(e){ console.warn('jestGlobalSetup: could not remove test.db', e.message); }
  // set env for tests
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./test.db';
};
