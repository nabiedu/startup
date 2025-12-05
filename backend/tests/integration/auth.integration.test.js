const request = require('supertest');
const { app, prisma } = require('../../app');

describe('Auth integration', ()=>{
  afterAll(async ()=>{ await prisma.$disconnect(); });

  test('register -> login -> me', async ()=>{
    const email = `test+${Date.now()}@example.com`;
    const password = 'password123';
    // register
    const r1 = await request(app).post('/auth/register').send({ email, password, name: 'Test' });
    expect(r1.status).toBe(201);
    expect(r1.body.email).toBe(email);

    // login
    const r2 = await request(app).post('/auth/login').send({ email, password });
    expect(r2.status).toBe(200);
    expect(r2.body).toHaveProperty('token');
    const token = r2.body.token;

    // me
    const r3 = await request(app).get('/auth/me').set('Authorization', `Bearer ${token}`);
    expect(r3.status).toBe(200);
    expect(r3.body.email).toBe(email);
  });
});
