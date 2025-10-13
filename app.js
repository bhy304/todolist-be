const express = require('express');
const app = express();


const PORT = process.env.PORT || 3000;

const userRouter = require('./routes/users');
const todoRouter = require('./routes/todos');

// 미들웨어
app.use(express.json());

// 라우트
app.use('/', userRouter);
app.use('/todos', todoRouter);

// 서버 시작
app.listen(PORT);
