const { body, param, validationResult } = require('express-validator');
const { StatusCodes } = require('http-status-codes');
const { verifyToken } = require('../utils/authorizeUtils');

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        errorCode: 'TOKEN_MISSING',
        message: '인증 토큰이 필요합니다.',
      });
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      errorCode: error.code || 'AUTHENTICATION_ERROR',
      message: error.message || '인증에 실패했습니다.',
    });
  }
};

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) return next();

  const { formattedErrors, errorMap } = errors.array().reduce(
    (acc, error) => {
      const field = error.path || error.param;
      acc.formattedErrors.push({
        field,
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
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#]).+$/)
    .withMessage('비밀번호는 대소문자, 숫자, 특수문자를 포함해야 합니다.'),
  validateRequest,
];

const validateLogin = [
  body('username').notEmpty().withMessage('아이디를 입력해주세요.').trim(),
  body('password').notEmpty().withMessage('비밀번호를 입력해주세요.'),
  validateRequest,
];

const validateCreateTodo = [
  body('content')
    .notEmpty()
    .withMessage('할 일 제목을 입력해주세요.')
    .isLength({ max: 255 })
    .withMessage('제목은 255자 이내로 입력해주세요'),
  validateRequest,
];

const validateUpdateTodo = [
  param('id').notEmpty().withMessage('할 일 id가 필요합니다.'),
  body('content')
    .notEmpty()
    .withMessage('수정할 내용을 입력해주세요.')
    .isLength({ max: 255 })
    .withMessage('제목은 255자 이내로 입력해주세요'),
  body('is_done')
    .optional()
    .isBoolean()
    .withMessage('is_done은 boolean 값이어야 합니다.'),
  validateRequest,
];

const validateDeleteTodo = [
  param('id').notEmpty().withMessage('할 일 id가 필요합니다.'),
  validateRequest,
];

const validateCreateTeam = [
  body('teamname').notEmpty().withMessage('팀 이름을 입력해주세요.'),
  validateRequest,
];

const validateDeleteTeam = [
  param('id').notEmpty().withMessage('팀 id가 필요합니다.'),
  validateRequest,
];

const validateInviteTeamMember = [
  param('id').notEmpty().withMessage('팀 id가 필요합니다.'),
  body('username').notEmpty().withMessage('팀원 이름을 입력해주세요.'),
  validateRequest,
];

const validateDeleteTeamMember = [
  param('teamId').notEmpty().withMessage('팀 id가 필요합니다.'),
  param('memberId').notEmpty().withMessage('팀원 id가 필요합니다.'),
  validateRequest,
];

const validateGetTeamMembers = [
  param('id').notEmpty().withMessage('팀 id가 필요합니다.'),
  validateRequest,
];

module.exports = {
  authenticateToken,
  validateJoin,
  validateLogin,
  validateCreateTodo,
  validateUpdateTodo,
  validateDeleteTodo,
  validateCreateTeam,
  validateDeleteTeam,
  validateInviteTeamMember,
  validateDeleteTeamMember,
  validateGetTeamMembers,
};
