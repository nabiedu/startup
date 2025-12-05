const fs = require('fs');
const path = require('path');

module.exports = async () => {
  // cleanup test.db after tests
  const db = path.resolve(__dirname, '..', 'test.db');
  try{
    if (fs.existsSync(db)) fs.unlinkSync(db);
    console.log('jestGlobalTeardown: removed test.db');
  }catch(e){ console.warn('jestGlobalTeardown: could not remove test.db', e.message); }
};
