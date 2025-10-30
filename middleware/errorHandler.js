const { StatusCodes } = require('http-status-codes');

const errorHandler = (res, err, message) => {
  console.log(err);
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    errorCode: 'DATABASE_ERROR',
    message: message || '서버 오류가 발생했습니다.',
  });
};

module.exports = errorHandler;
