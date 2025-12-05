const request = require('supertest');
const { app } = require('../app');
const prisma = require('@prisma/client').PrismaClient.prototype;
jest.mock('@prisma/client', () => {
  const m = jest.requireActual('@prisma/client');
  const PrismaClient = function(){
    return {
      user: {
        findUnique: jest.fn(),
        create: jest.fn()
      },
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn()
      }
    };
  };
  return { PrismaClient };
});

describe('Auth endpoints', ()=>{
  let prismaClient;
  beforeAll(()=>{ prismaClient = new (require('@prisma/client').PrismaClient)(); });
  afterEach(()=>{ jest.clearAllMocks(); });

  test('register returns 201 on success', async ()=>{
    prismaClient.user.findUnique.mockResolvedValue(null);
    prismaClient.user.create.mockResolvedValue({ id:1, email:'a@b.test', name:'A' });
    const res = await request(app).post('/auth/register').send({ email:'a@b.test', password:'secret', name:'A' });
    expect(res.status).toBe(201);
    expect(res.body.email).toBe('a@b.test');
  });

  test('login returns token on valid creds', async ()=>{
    const hashed = await require('bcrypt').hash('secret',10);
    prismaClient.user.findUnique.mockResolvedValue({ id:2, email:'c@d.test', password: hashed, name:'C', role:'user' });
    prismaClient.refreshToken.create.mockResolvedValue({ token:'rt' });
    const res = await request(app).post('/auth/login').send({ email:'c@d.test', password:'secret' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});
const request = require('supertest');
const { app, prisma } = require('../app');

describe('auth flow', ()=>{
  it('health ok', async ()=>{
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  // Note: registration will write to DB; tests should run against a test DB or use transactions
});
