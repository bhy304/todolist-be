const express = require('express');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 8080;

const corsOptions = {
  origin: ['http://localhost:3000', 'https://todolist-fe-puce.vercel.app'], // 프론트엔드 도메인
  credentials: true, // 쿠키 전달을 위해 필요
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // 허용할 HTTP 메서드
  allowedHeaders: ['Content-Type', 'Authorization'], // 허용할 헤더
  exposedHeaders: ['Content-Length', 'X-Total-Count'], // 클라이언트에 노출할 헤더
  maxAge: 3600, // preflight 요청 결과를 캐시하는 시간 (초)
};

const userRouter = require('./routes/users');
const todoRouter = require('./routes/todos');

// CORS 설정 미들웨어
app.use(cors(corsOptions));
// 미들웨어
app.use(express.json());
// 라우트
app.use('/users', userRouter);
app.use('/todos', todoRouter);
// 서버 시작
app.listen(PORT);

module.exports = app;
