const { body, param, validationResult } = require('express-validator');
const { StatusCodes } = require('http-status-codes');
const { verifyToken } = require('../utils/authorizeUtils');

/**
 * JWT 토큰을 검증하는 미들웨어
 * Authorization 헤더에서 Bearer 토큰을 추출하여 검증하고,
 * 검증된 사용자 정보를 req.user에 저장합니다.
 */
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: '인증 토큰이 필요합니다.',
      });
    }

    const decoded = verifyToken(token);
    req.user = decoded; // 검증된 사용자 정보를 req.user에 저장
    next();
  } catch (error) {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: error.message || '유효하지 않은 토큰입니다.',
    });
  }
};

// 유효성 검사 결과를 확인하는 미들웨어
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) return next();

  return res.status(StatusCodes.BAD_REQUEST).json({
    success: false,
    errors: errors.array(),
  });
};

// 회원가입 유효성 검사 규칙 정의
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

// 로그인 유효성 검사 규칙 정의
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

// 할일 전체 조회
const validateGetTodos = [
  // body('userId').notEmpty().isInt().withMessage('userId는 숫자여야 합니다.'),
  validateRequest,
];

// 할일 등록
const validateCreateTodo = [
  body('content')
    .notEmpty()
    .withMessage('할 일 제목을 입력해주세요.')
    .isLength({ max: 255 })
    .withMessage('제목은 255자 이내로 입력해주세요'),
  validateRequest,
];

// 할일 수정
const validateUpdateTodo = [
  param('id').notEmpty().withMessage('할 일 id 필요해'),
  validateRequest,
];
// 할일 삭제
const validateDeleteTodo = [
  param('id').notEmpty().withMessage('할일 id 필요'),
  validateRequest,
];

module.exports = {
  authenticateToken,
  validateJoin,
  validateLogin,
  validateGetTodos,
  validateCreateTodo,
  validateUpdateTodo,
  validateDeleteTodo,
};
