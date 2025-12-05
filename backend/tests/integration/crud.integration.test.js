const request = require('supertest');
const { app, prisma } = require('../../app');

describe('CRUD integration', ()=>{
  afterAll(async ()=>{ await prisma.$disconnect(); });

  test('create housing (anon) and list', async ()=>{
    // create anonymous housing
    const r1 = await request(app).post('/housing').send({ type: 'flat', city: 'Moscow' });
    expect(r1.status).toBe(201);
    expect(r1.body).toHaveProperty('id');
    const id = r1.body.id;

    // list
    const r2 = await request(app).get('/housing');
    expect(r2.status).toBe(200);
    expect(Array.isArray(r2.body.items)).toBeTruthy();
    const found = r2.body.items.find(i=>i.id===id);
    expect(found).toBeDefined();

    // cleanup
    await prisma.housing.delete({ where: { id } });
  });
});
