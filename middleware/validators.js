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
        success: false,
        errorCode: 'TOKEN_MISSING',
        message: '인증 토큰이 필요합니다.',
      });
    }

    const decoded = verifyToken(token);
    req.user = decoded; // 검증된 사용자 정보를 req.user에 저장
    next();
  } catch (error) {
    const statusCode =
      error.code === 'TOKEN_EXPIRED'
        ? StatusCodes.FORBIDDEN
        : StatusCodes.UNAUTHORIZED;

    return res.status(statusCode).json({
      success: false,
      errorCode: error.code || 'AUTHENTICATION_ERROR',
      message: error.message || '인증에 실패했습니다.',
    });
  }
};

// 유효성 검사 결과를 확인하는 미들웨어
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) return next();

  const { formattedErrors, errorMap } = errors.array().reduce(
    (acc, error) => {
      const field = error.path || error.param;
      acc.formattedErrors.push({
        field: field,
        message: error.msg,
        value: error.value,
      });
      if (!acc.errorMap[field]) {
        acc.errorMap[field] = error.msg;
      }
      return acc;
    },
    { formattedErrors: [], errorMap: {} }
  );

  return res.status(StatusCodes.BAD_REQUEST).json({
    success: false,
    message: '입력 값 검증에 실패했습니다.',
    errors: formattedErrors,
    errorMap: errorMap,
  });
};

// 회원가입 유효성 검사 규칙 정의
const validateJoin = [
  body('username')
    .notEmpty()
    .withMessage('아이디를 입력해주세요.')
    .trim()
    .isLength({ min: 4, max: 20 })
    .withMessage('아이디는 4자 이상 20자 이내여야 합니다.')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('아이디는 영문, 숫자, 밑줄(_), 대시(-)만 사용할 수 있습니다.'),
  body('password')
    .notEmpty()
    .withMessage('비밀번호를 입력해주세요.')
    .isLength({ min: 8, max: 20 })
    .withMessage('비밀번호는 8자 이상 20자 이내여야 합니다.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/)
    .withMessage('비밀번호는 대소문자, 숫자, 특수문자를 포함해야 합니다.'),
  validateRequest,
];

// 로그인 유효성 검사 규칙 정의
const validateLogin = [
  body('username').notEmpty().withMessage('아이디를 입력해주세요.').trim(),
  body('password').notEmpty().withMessage('비밀번호를 입력해주세요.'),
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
  validateCreateTodo,
  validateUpdateTodo,
  validateDeleteTodo,
};
