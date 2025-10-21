const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable must be set');
}

const JWT_TOKEN_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = '15m';

const createToken = payload => {
  return jwt.sign(payload, JWT_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
};

const verifyToken = token => {
  try {
    return jwt.verify(token, JWT_TOKEN_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('토큰이 만료되었습니다.');
    }
    throw new Error('유효하지 않은 토큰입니다.');
  }
};

module.exports = { createToken, verifyToken };
