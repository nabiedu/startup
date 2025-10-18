const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Low, JSONFile } = require('lowdb');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// lowdb setup (file-based, simple for starter)
const file = path.join(__dirname, 'data.json');
const adapter = new JSONFile(file);
const db = new Low(adapter);

async function initDB(){
  await db.read();
  db.data = db.data || { housing: [], jobs: [], docs: [], profiles: [] };
  await db.write();
}

initDB();

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Generic CRUD: list and create for housing, jobs, docs, profiles
['housing','jobs','docs','profiles'].forEach((col) => {
  app.get('/' + col, async (req, res) => {
    await db.read();
    res.json(db.data[col] || []);
  });

  app.post('/' + col, async (req, res) => {
    const item = Object.assign({}, req.body, { id: Date.now().toString() });
    await db.read();
    db.data[col] = db.data[col] || [];
    db.data[col].unshift(item);
    await db.write();
    res.status(201).json(item);
  });
});

// Serve frontend static files when in production
app.use('/', express.static(path.join(__dirname, '..', 'frontend')));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
