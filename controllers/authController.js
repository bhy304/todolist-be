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
          message: '이미 존재하는 아이디입니다.',
        }); // 409 : 이미 존재하는 리소스를 생성하려고 할 때 사용
      }

      console.log(err);
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
      return res.status(StatusCodes.BAD_REQUEST).end();
    }

    const [loginUser] = results;

    // 사용자가 존재하지 않는 경우
    if (!loginUser) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: '아이디 또는 비밀번호가 틀렸습니다.',
      });
    }

    // 사용자가 존재하는 경우에만 비밀번호 검증
    const hashPassword = crypto
      .pbkdf2Sync(password, loginUser.salt, 10000, 16, 'sha512')
      .toString('base64');

    // 비밀번호가 일치하지 않는 경우
    if (loginUser.password !== hashPassword) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: '아이디 또는 비밀번호가 틀렸습니다.',
      });
    }

    // 인증 성공
    const token = createToken({ email: loginUser.username });

    res.cookie('token', token, {
      httpOnly: true,
    });

    res.status(StatusCodes.OK).json({
      message: '로그인되었습니다.',
    });
  });
};

module.exports = { join, login };
