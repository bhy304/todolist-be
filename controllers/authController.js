const pool = require('../mariadb');
const crypto = require('crypto');
const { StatusCodes } = require('http-status-codes');
const { createToken } = require('../utils/authorizeUtils');
const { handleError } = require('../middleware/errorHandler');

const join = async (req, res) => {
  try {
    const { username, password } = req.body;
    const sql = 'INSERT INTO users (username, password, salt) VALUES (?, ?, ?)';

    const salt = crypto.randomBytes(16).toString('base64');
    const hashPassword = crypto
      .pbkdf2Sync(password, salt, 10000, 16, 'sha512')
      .toString('base64');

    await pool.query(sql, [username, hashPassword, salt]);

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: '회원가입되었습니다.',
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        errorCode: 'DUPLICATE_USERNAME',
        message: '이미 존재하는 아이디입니다.',
      });
    }

    return res.status(StatusCodes.BAD_REQUEST).end();
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users WHERE username = ?';

    const [[loginUser]] = await pool.query(sql, [username]);

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

    return res.status(StatusCodes.OK).json({
      success: true,
      message: '로그인되었습니다.',
      token: token,
      user: {
        id: loginUser.id,
        username: loginUser.username,
      },
    });
  } catch (error) {
    handleError(error, res);
  }
};

module.exports = { join, login };
