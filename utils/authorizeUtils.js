const jwt = require('jsonwebtoken');

const JWT_TOKEN_SECRET = process.env.JWT_SECRET || 'jwtTokenSalt';
const ACCESS_TOKEN_EXPIRES_IN = '30m';

const createToken = payload => {
  return jwt.sign(payload, JWT_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
};

module.exports = { createToken };
