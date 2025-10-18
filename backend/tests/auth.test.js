const request = require('supertest');
const { app, prisma } = require('../app');

describe('auth flow', ()=>{
  it('health ok', async ()=>{
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  // Note: registration will write to DB; tests should run against a test DB or use transactions
});
