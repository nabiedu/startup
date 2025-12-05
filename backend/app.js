require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const isPhone = v => /^(\+?\d[\d\s\-()]{5,}\d)$/.test(v);
const { PrismaClient } = require('@prisma/client');
const client = require('prom-client');

// security / logging deps
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const winston = require('winston');

const prisma = new PrismaClient();
const app = express();
// basic helmet protections
app.use(helmet());
// add a stricter Content-Security-Policy allowing fonts/google and CDN for DOMPurify used in frontend
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
    styleSrc: ["'self'", 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    imgSrc: ["'self'", 'data:'],
    connectSrc: ["'self'", 'http://localhost:4000', 'https://localhost:4000'],
  }
}));
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());

// simple logger
const logger = winston.createLogger({ level: 'info', transports: [ new winston.transports.Console() ] });

// rate limiter
app.use(rateLimit({ windowMs: 15*60*1000, max: 200 }));

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

// simple server-side sanitizer for strings (best-effort)
function sanitizeString(v){ if(typeof v !== 'string') return v; return v.replace(/<[^>]*>?/gm, ''); }
function sanitizeBody(body, fields){ const out = { ...body }; for(const f of fields){ if(f in out) out[f] = sanitizeString(out[f]); } return out; }

app.get('/metrics', async (req,res)=>{ res.set('Content-Type', client.register.contentType); res.end(await client.register.metrics()); });

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Auth: register/login
app.post('/auth/register',[
  body('email').isEmail(), body('password').isLength({ min:6 }), body('name').optional().isLength({ min:2 })
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
    // access token short-lived
    const access = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '15m' });
    // refresh token long-lived
    const refresh = jwt.sign({ sub: user.id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
  await prisma.refreshToken.create({ data: { token: refresh, userId: user.id } });
  const cookieOpts = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7*24*3600*1000 };
  res.cookie('refresh_token', refresh, cookieOpts);
    res.json({ token: access, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  }catch(e){ next(e); }
});

// refresh endpoint
app.post('/auth/refresh', async (req,res)=>{
  const r = req.cookies['refresh_token']; if(!r) return res.status(401).json({ message: 'No refresh token' });
  try{
    const payload = jwt.verify(r, process.env.JWT_SECRET || 'dev-secret');
    const rec = await prisma.refreshToken.findUnique({ where: { token: r } });
    if(!rec || rec.revoked) return res.status(401).json({ message: 'Invalid refresh token' });
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    const access = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '15m' });
    return res.json({ token: access });
  }catch(e){ return res.status(401).json({ message: 'Invalid refresh token' }); }
});

// logout
app.post('/auth/logout', async (req,res)=>{
  const r = req.cookies['refresh_token']; if(!r){ res.clearCookie('refresh_token'); return res.json({ ok:true }); }
  await prisma.refreshToken.updateMany({ where: { token: r }, data: { revoked: true } }).catch(()=>{});
  res.clearCookie('refresh_token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
  res.json({ ok:true });
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
// Helper: parse pagination/filter params
function parseQuery(req){
  const page = Math.max(1, parseInt(req.query.page||'1'));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit||'10')));
  const q = (req.query.q||'').toString().trim();
  const city = (req.query.city||'').toString().trim();
  const type = (req.query.type||'').toString().trim();
  const sort = req.query.sort || 'createdAt:desc';
  return { page, limit, q, city, type, sort };
}

function buildWhereForHousing({ q, city, type }){
  const where = {};
  if(q){ where.OR = [ { city: { contains: q, mode: 'insensitive' } }, { type: { contains: q, mode: 'insensitive' } }, { contact: { contains: q, mode: 'insensitive' } } ]; }
  if(city) where.city = { contains: city, mode: 'insensitive' };
  if(type) where.type = { contains: type, mode: 'insensitive' };
  return where;
}

app.get('/housing', async (req,res,next)=>{
  try{
    const { page, limit, q, city, type, sort } = parseQuery(req);
    const where = buildWhereForHousing({ q, city, type });
    const [total, items] = await Promise.all([
      prisma.housing.count({ where }),
      prisma.housing.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page-1)*limit, take: limit })
    ]);
    res.json({ items, meta: { total, page, limit, totalPages: Math.ceil(total/limit) } });
  }catch(e){ next(e); }
});

app.post('/housing', [body('type').notEmpty(), body('city').notEmpty()], async (req,res,next)=>{
  try{
    const errors = validationResult(req); if(!errors.isEmpty()) return res.status(400).json({ error:'validation', details: errors.array() });
    const data = sanitizeBody(req.body, ['type','city','price','contact']);
    if(req.headers.authorization){ try{ const token=req.headers.authorization.split(' ')[1]; const decoded=jwt.verify(token, process.env.JWT_SECRET||'dev-secret'); data.ownerId = decoded.sub; }catch(e){} }
    const item = await prisma.housing.create({ data });
    logger.info('housing.create', { id: item.id, owner: item.ownerId });
    res.status(201).json(item);
  }catch(e){ next(e); }
});

// update housing
app.put('/housing/:id', [body('type').optional().notEmpty(), body('city').optional().notEmpty()], authMiddleware, async (req,res,next)=>{
  try{
    const id = parseInt(req.params.id);
    const existing = await prisma.housing.findUnique({ where:{ id } });
    if(!existing) return res.status(404).json({ error:'not_found' });
    if(existing.ownerId && req.user.sub!==existing.ownerId && req.user.role!=='admin') return res.status(403).json({ error:'forbidden' });
    const errors = validationResult(req); if(!errors.isEmpty()) return res.status(400).json({ error:'validation', details: errors.array() });
    const updated = await prisma.housing.update({ where:{ id }, data: req.body });
    logger.info('housing.update', { id, by: req.user.sub });
    res.json(updated);
  }catch(e){ next(e); }
});

// delete housing
app.delete('/housing/:id', authMiddleware, async (req,res,next)=>{
  try{
    const id = parseInt(req.params.id);
    const existing = await prisma.housing.findUnique({ where:{ id } });
    if(!existing) return res.status(404).json({ error:'not_found' });
    if(existing.ownerId && req.user.sub!==existing.ownerId && req.user.role!=='admin') return res.status(403).json({ error:'forbidden' });
    await prisma.housing.delete({ where:{ id } });
    logger.info('housing.delete', { id, by: req.user.sub });
    res.json({ ok:true });
  }catch(e){ next(e); }
});

app.get('/jobs', async (req,res,next)=>{
  try{
    const { page, limit, q, city, type } = parseQuery(req);
    const where = {};
    if(q) where.OR = [ { title: { contains: q, mode:'insensitive' } }, { city: { contains: q, mode:'insensitive' } }, { contact: { contains: q, mode:'insensitive' } } ];
    if(city) where.city = { contains: city, mode:'insensitive' };
    const [total, items] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({ where, orderBy:{ createdAt:'desc' }, skip: (page-1)*limit, take: limit })
    ]);
    res.json({ items, meta: { total, page, limit, totalPages: Math.ceil(total/limit) } });
  }catch(e){ next(e); }
});

app.post('/jobs', [body('title').notEmpty(), body('city').notEmpty()], async (req,res,next)=>{
  try{
    const errors = validationResult(req); if(!errors.isEmpty()) return res.status(400).json({ error:'validation', details: errors.array() });
    const data = sanitizeBody(req.body, ['title','city','salary','contact']); if(req.headers.authorization){ try{ const token=req.headers.authorization.split(' ')[1]; const decoded=jwt.verify(token, process.env.JWT_SECRET||'dev-secret'); data.ownerId = decoded.sub; }catch(e){} }
    const item = await prisma.job.create({ data });
    logger.info('job.create',{ id: item.id, owner: item.ownerId });
    res.status(201).json(item);
  }catch(e){ next(e); }
});

app.put('/jobs/:id', [body('title').optional().notEmpty(), body('city').optional().notEmpty()], authMiddleware, async (req,res,next)=>{
  try{
    const id = parseInt(req.params.id);
    const existing = await prisma.job.findUnique({ where:{ id } }); if(!existing) return res.status(404).json({ error:'not_found' });
    if(existing.ownerId && req.user.sub!==existing.ownerId && req.user.role!=='admin') return res.status(403).json({ error:'forbidden' });
    const errors = validationResult(req); if(!errors.isEmpty()) return res.status(400).json({ error:'validation', details: errors.array() });
    const updated = await prisma.job.update({ where:{ id }, data: req.body });
    logger.info('job.update',{ id, by: req.user.sub });
    res.json(updated);
  }catch(e){ next(e); }
});

app.delete('/jobs/:id', authMiddleware, async (req,res,next)=>{
  try{
    const id = parseInt(req.params.id);
    const existing = await prisma.job.findUnique({ where:{ id } }); if(!existing) return res.status(404).json({ error:'not_found' });
    if(existing.ownerId && req.user.sub!==existing.ownerId && req.user.role!=='admin') return res.status(403).json({ error:'forbidden' });
    await prisma.job.delete({ where:{ id } });
    logger.info('job.delete',{ id, by: req.user.sub });
    res.json({ ok:true });
  }catch(e){ next(e); }
});

app.get('/docs', async (req,res,next)=>{ try{ const items = await prisma.docRequest.findMany({ orderBy:{ createdAt: 'desc' } }); res.json(items); }catch(e){next(e)} });
app.post('/docs', [body('type').notEmpty(), body('name').notEmpty(), body('phone').notEmpty()], async (req,res,next)=>{
  try{
    const errors = validationResult(req); if(!errors.isEmpty()) return res.status(400).json({ error:'validation', details: errors.array() });
    const data = sanitizeBody(req.body, ['type','name','phone','email','comment']);
    if(!isPhone(data.phone)) return res.status(400).json({ error:'validation', message:'Invalid phone format' });
    const item = await prisma.docRequest.create({ data });
    res.status(201).json(item);
  }catch(e){ next(e) }
});

// update/delete for docs
app.put('/docs/:id', authMiddleware, async (req,res,next)=>{ try{ const id = parseInt(req.params.id); const existing = await prisma.docRequest.findUnique({ where:{ id } }); if(!existing) return res.status(404).json({ message:'Not found' }); if(existing.ownerId && req.user.sub!==existing.ownerId && req.user.role!=='admin') return res.status(403).json({ message:'Forbidden' }); const item = await prisma.docRequest.update({ where:{ id }, data: req.body }); res.json(item); }catch(e){next(e)} });

app.delete('/docs/:id', authMiddleware, async (req,res,next)=>{ try{ const id = parseInt(req.params.id); const existing = await prisma.docRequest.findUnique({ where:{ id } }); if(!existing) return res.status(404).json({ message:'Not found' }); if(existing.ownerId && req.user.sub!==existing.ownerId && req.user.role!=='admin') return res.status(403).json({ message:'Forbidden' }); await prisma.docRequest.delete({ where:{ id } }); res.json({ ok:true }); }catch(e){next(e)} });

// profiles — admin only
app.get('/profiles', authMiddleware, adminOnly, async (req,res,next)=>{ try{ const users = await prisma.user.findMany({ select:{ id:true, email:true, name:true, role:true, createdAt:true }, orderBy:{ createdAt:'desc' } }); res.json(users); }catch(e){next(e)} });

// update user (admin only) - change role or name
app.put('/profiles/:id', authMiddleware, adminOnly, async (req,res,next)=>{
  try{
    const id = parseInt(req.params.id);
    const { role, name } = req.body;
    const user = await prisma.user.update({ where:{ id }, data: { role, name } });
    res.json(user);
  }catch(e){ next(e); }
});

// delete user (admin only)
app.delete('/profiles/:id', authMiddleware, adminOnly, async (req,res,next)=>{
  try{
    const id = parseInt(req.params.id);
    await prisma.refreshToken.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });
    res.json({ ok:true });
  }catch(e){ next(e); }
});

// Serve frontend static files
app.use('/', express.static(path.join(__dirname, '..', 'frontend')));

// Error handler
// unified error handler
app.use((err, req, res, next)=>{
  logger.error(err.stack || err);
  if(res.headersSent) return next(err);
  if(err.name === 'ValidationError') return res.status(400).json({ error:'validation', message: err.message });
  res.status(500).json({ error:'internal', message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : (err.message || 'Internal Server Error') });
});

module.exports = { app, prisma };
