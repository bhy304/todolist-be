const pool = require('../mariadb');
const { StatusCodes } = require('http-status-codes');
const { createToken } = require('../utils/authorizeUtils');
const crypto = require('crypto');

const join = (req, res) => {
  const { username, password } = req.body;
  const sql = 'INSERT INTO users (username, password, salt) VALUES (?, ?, ?)';

  const salt = crypto.randomBytes(16).toString('base64');
  const hashPassword = crypto
    .pbkdf2Sync(password, salt, 10000, 16, 'sha512')
    .toString('base64');

  pool.query(sql, [username, hashPassword, salt], (err, results) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(StatusCodes.CONFLICT).json({
          success: false,
          errorCode: 'DUPLICATE_USERNAME',
          message: '이미 존재하는 아이디입니다.',
        });
      }

      return res.status(StatusCodes.BAD_REQUEST).end();
    }

    res.status(StatusCodes.CREATED).json(results);
  });
};

const login = (req, res) => {
  const { username, password } = req.body;
  const sql = 'SELECT * FROM users WHERE username = ?';

  pool.query(sql, username, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        errorCode: 'DATABASE_ERROR',
        message: '서버 오류가 발생했습니다.',
      });
    }

    const [loginUser] = results;

    if (!loginUser) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        errorCode: 'INVALID_CREDENTIALS',
        message: '아이디 또는 비밀번호가 일치하지 않습니다.',
      });
    }

    const hashPassword = crypto
      .pbkdf2Sync(password, loginUser.salt, 10000, 16, 'sha512')
      .toString('base64');

    if (loginUser.password !== hashPassword) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        errorCode: 'INVALID_CREDENTIALS',
        message: '아이디 또는 비밀번호가 일치하지 않습니다.',
      });
    }

    const token = createToken({
      id: loginUser.id,
      username: loginUser.username,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: '로그인되었습니다.',
      token: token,
      user: {
        id: loginUser.id,
        username: loginUser.username,
      },
    });
  });
};

module.exports = { join, login };
