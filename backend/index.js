const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { app, prisma } = require('./app');

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, ()=>console.log(`Server listening on ${PORT}`));

process.on('SIGINT', async ()=>{ console.log('Shutting down...'); server.close(); await prisma.$disconnect(); process.exit(0); });
app.listen(PORT, ()=>console.log(`Server listening on ${PORT}`));
