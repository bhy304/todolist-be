const express = require('express');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 8080;

const corsOptions = {
  origin: ['http://localhost:3000', 'https://todolist-fe-puce.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'X-Total-Count'],
  maxAge: 3600,
};

const userRouter = require('./routes/users');
const todoRouter = require('./routes/todos');
const teamRouter = require('./routes/teams');

app.use(cors(corsOptions));

app.use(express.json());

app.use('/users', userRouter);
app.use('/todos', todoRouter);
app.use('/teams', teamRouter);

app.listen(PORT);

module.exports = app;
