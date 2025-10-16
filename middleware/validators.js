const { body, validationResult } = require('express-validator');
const { StatusCodes } = require('http-status-codes');

// 유효성 검사 결과를 확인하는 미들웨어
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) return next();

  return res.status(StatusCodes.BAD_REQUEST).json({
    success: false,
    errors: errors.array(),
  });
};

// 회원가입 유효성 검사
const validateJoin = [
  body('username')
    .notEmpty()
    .withMessage('값이 입력되지 않았습니다.')
    .isString()
    .withMessage('문자열이 아닙니다.'),
  body('password')
    .notEmpty()
    .withMessage('값이 입력되지 않았습니다.')
    .isString()
    .withMessage('문자열이 아닙니다.'),
  validateRequest,
];

// 로그인 유효성 검사
const validateLogin = [
  body('username')
    .notEmpty()
    .withMessage('값이 입력되지 않았습니다.')
    .isString()
    .withMessage('문자열이 아닙니다.'),
  body('password')
    .notEmpty()
    .withMessage('값이 입력되지 않았습니다.')
    .isString()
    .withMessage('문자열이 아닙니다.'),
  validateRequest,
];

module.exports = {
  validateJoin,
  validateLogin,
};
