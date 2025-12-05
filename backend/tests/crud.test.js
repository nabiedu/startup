const request = require('supertest');
const { app } = require('../app');

jest.mock('@prisma/client', () => {
  const PrismaClient = function(){
    return {
      housing: { findMany: jest.fn(), create: jest.fn() },
      job: { findMany: jest.fn(), create: jest.fn() },
      docRequest: { findMany: jest.fn(), create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() }
    };
  };
  return { PrismaClient };
});

describe('CRUD endpoints', ()=>{
  let prismaClient;
  beforeAll(()=>{ prismaClient = new (require('@prisma/client').PrismaClient)(); });
  afterEach(()=>{ jest.clearAllMocks(); });

  test('GET /housing returns array', async ()=>{
    prismaClient.housing.findMany.mockResolvedValue([{ id:1, city:'A' }]);
    const res = await request(app).get('/housing');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /housing creates item', async ()=>{
    prismaClient.housing.create.mockResolvedValue({ id:2, city:'B', type:'room' });
    const res = await request(app).post('/housing').send({ city:'B', type:'room' });
    expect(res.status).toBe(201);
    expect(res.body.city).toBe('B');
  });

  test('GET /jobs returns array', async ()=>{
    prismaClient.job.findMany.mockResolvedValue([{ id:1, title:'dev' }]);
    const res = await request(app).get('/jobs');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

});
