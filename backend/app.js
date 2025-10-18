require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const client = require('prom-client');

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Prometheus metrics
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();
const httpRequestCounter = new client.Counter({ name: 'http_requests_total', help: 'Total HTTP requests' });
const httpRequestDuration = new client.Histogram({ name: 'http_request_duration_seconds', help: 'HTTP request duration seconds', buckets: [0.01,0.05,0.1,0.5,1,2,5] });

app.use((req,res,next)=>{
  const end = httpRequestDuration.startTimer();
  res.on('finish', ()=>{ end(); httpRequestCounter.inc(); });
  next();
});

app.get('/metrics', async (req,res)=>{ res.set('Content-Type', client.register.contentType); res.end(await client.register.metrics()); });

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Auth: register/login
app.post('/auth/register',[
  body('email').isEmail(), body('password').isLength({ min:6 })
], async (req,res,next)=>{
  try{
    const errors = validationResult(req); if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, password, name } = req.body;
    const exists = await prisma.user.findUnique({ where: { email } });
    if(exists) return res.status(400).json({ message: 'Email already in use' });
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password: hash, name } });
    res.status(201).json({ id: user.id, email: user.email, name: user.name });
  }catch(e){ next(e); }
});

app.post('/auth/login', [body('email').isEmail(), body('password').exists()], async (req,res,next)=>{
  try{
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if(!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if(!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  }catch(e){ next(e); }
});

// middleware
function authMiddleware(req,res,next){
  const auth = req.headers.authorization; if(!auth) return res.status(401).json({ message: 'Missing auth' });
  const parts = auth.split(' '); if(parts.length!==2) return res.status(401).json({ message: 'Invalid auth' });
  try{ const decoded = jwt.verify(parts[1], process.env.JWT_SECRET || 'dev-secret'); req.user = decoded; next(); }catch(e){ return res.status(401).json({ message: 'Invalid token' }); }
}

function adminOnly(req,res,next){ if(!req.user) return res.status(401).json({ message:'Not authenticated' }); if(req.user.role!=='admin') return res.status(403).json({ message:'Forbidden' }); next(); }

app.get('/auth/me', authMiddleware, async (req,res)=>{
  const u = await prisma.user.findUnique({ where:{ id: req.user.sub }, select:{ id:true, email:true, name:true, role:true } });
  res.json(u);
});

// CRUD endpoints using Prisma with basic validation
app.get('/housing', async (req,res,next)=>{ try{ const items = await prisma.housing.findMany({ orderBy:{ createdAt: 'desc' } }); res.json(items); }catch(e){next(e)} });
app.post('/housing', [body('type').notEmpty(), body('city').notEmpty()], async (req,res,next)=>{ try{ const data = req.body; const item = await prisma.housing.create({ data }); res.status(201).json(item); }catch(e){next(e)} });

app.get('/jobs', async (req,res,next)=>{ try{ const items = await prisma.job.findMany({ orderBy:{ createdAt: 'desc' } }); res.json(items); }catch(e){next(e)} });
app.post('/jobs', [body('title').notEmpty(), body('city').notEmpty()], async (req,res,next)=>{ try{ const data = req.body; const item = await prisma.job.create({ data }); res.status(201).json(item); }catch(e){next(e)} });

app.get('/docs', async (req,res,next)=>{ try{ const items = await prisma.docRequest.findMany({ orderBy:{ createdAt: 'desc' } }); res.json(items); }catch(e){next(e)} });
app.post('/docs', [body('type').notEmpty(), body('name').notEmpty(), body('phone').notEmpty()], async (req,res,next)=>{ try{ const data = req.body; const item = await prisma.docRequest.create({ data }); res.status(201).json(item); }catch(e){next(e)} });

// profiles — admin only
app.get('/profiles', authMiddleware, adminOnly, async (req,res,next)=>{ try{ const users = await prisma.user.findMany({ select:{ id:true, email:true, name:true, role:true, createdAt:true }, orderBy:{ createdAt:'desc' } }); res.json(users); }catch(e){next(e)} });

// Serve frontend static files
app.use('/', express.static(path.join(__dirname, '..', 'frontend')));

// Error handler
app.use((err, req, res, next)=>{
  console.error(err);
  res.status(500).json({ message: 'Internal Server Error' });
});

module.exports = { app, prisma };
