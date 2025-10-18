const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Auth: register/login
app.post('/auth/register',[
  body('email').isEmail(), body('password').isLength({ min:6 })
], async (req,res)=>{
  const errors = validationResult(req); if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { email, password, name } = req.body;
  const exists = await prisma.user.findUnique({ where: { email } });
  if(exists) return res.status(400).json({ message: 'Email already in use' });
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, password: hash, name } });
  res.status(201).json({ id: user.id, email: user.email, name: user.name });
});

app.post('/auth/login', [body('email').isEmail(), body('password').exists()], async (req,res)=>{
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if(!user) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if(!ok) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

// middleware
function authMiddleware(req,res,next){
  const auth = req.headers.authorization; if(!auth) return res.status(401).json({ message: 'Missing auth' });
  const parts = auth.split(' '); if(parts.length!==2) return res.status(401).json({ message: 'Invalid auth' });
  try{ const decoded = jwt.verify(parts[1], process.env.JWT_SECRET || 'dev-secret'); req.user = decoded; next(); }catch(e){ return res.status(401).json({ message: 'Invalid token' }); }
}

function adminOnly(req,res,next){ if(!req.user) return res.status(401).json({ message:'Not authenticated' }); if(req.user.role!=='admin') return res.status(403).json({ message:'Forbidden' }); next(); }

// CRUD endpoints using Prisma
app.get('/housing', async (req,res)=>{ const items = await prisma.housing.findMany({ orderBy:{ createdAt: 'desc' } }); res.json(items); });
app.post('/housing', async (req,res)=>{ const data = req.body; const item = await prisma.housing.create({ data }); res.status(201).json(item); });

app.get('/jobs', async (req,res)=>{ const items = await prisma.job.findMany({ orderBy:{ createdAt: 'desc' } }); res.json(items); });
app.post('/jobs', async (req,res)=>{ const data = req.body; const item = await prisma.job.create({ data }); res.status(201).json(item); });

app.get('/docs', async (req,res)=>{ const items = await prisma.docRequest.findMany({ orderBy:{ createdAt: 'desc' } }); res.json(items); });
app.post('/docs', async (req,res)=>{ const data = req.body; const item = await prisma.docRequest.create({ data }); res.status(201).json(item); });

app.get('/profiles', async (req,res)=>{ const users = await prisma.user.findMany({ select:{ id:true, email:true, name:true, role:true, createdAt:true }, orderBy:{ createdAt:'desc' } }); res.json(users); });
app.post('/profiles', async (req,res)=>{ const data = req.body; // create lightweight profile as user without auth
  const item = await prisma.user.create({ data: { email: data.email || `u${Date.now()}@local`, password: 'noop', name: data.name } });
  res.status(201).json(item);
});

// Serve frontend static files
app.use('/', express.static(path.join(__dirname, '..', 'frontend')));

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=>console.log(`Server listening on ${PORT}`));
