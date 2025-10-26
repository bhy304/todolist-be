const pool = require('../mariadb');
const { StatusCodes } = require('http-status-codes');

const getTeamTodos = (req, res) => {
  const id = req.params.id;

  const sql = `SELECT * FROM todos WHERE team_id = ? ORDER BY todos.created_at DESC;`;

  pool.query(sql, id, function (err, results) {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }

    return res.status(StatusCodes.OK).json(results);
  });
};

const createTeamTodo = (req, res) => {
  const userId = req.user.id;
  const id = req.params.id;
  const { content } = req.body;

  const sql = `INSERT INTO todos(user_id, team_id, content) VALUES (?, ?, ?)`;

  pool.query(sql, [userId, id, content], function (err, results) {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }

    // 생성된 할 일 조회
    const selectSql = `SELECT * FROM todos WHERE id = ?`;
    pool.query(selectSql, [results.insertId], function (err, todos) {
      if (err) {
        console.log(err);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          errorCode: 'DATABASE_ERROR',
          message: '생성된 할 일 조회에 실패했습니다.',
        });
      }

      return res.status(StatusCodes.CREATED).json({
        success: true,
        message: '할 일이 생성되었습니다.',
        todo: todos[0], // 생성된 단일 할 일
      });
    });
  });
};

const updateTeamTodo = (req, res) => {
  const id = req.params.id;

  const { content } = req.body;

  if (!content || content.trim() === '') {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: '수정할 내용을 입력해주세요.',
    });
  }

  // 1단계: 할일 조회 및 team_id 추출
  pool.query('SELECT * FROM todos WHERE id = ?', id, (err, todos) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        errorCode: 'DATABASE_ERROR',
        message: '서버 오류가 발생했습니다.',
      });
    }

    // 할일이 없으면 404 반환
    // team_id가 null이면 400 반환 (개인 할일)
    if (todos.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        errorCode: 'NOT_FOUND',
        message: '해당 할일을 찾을 수 없습니다.',
      });
    }

    pool.query(
      'UPDATE todos SET content = ? WHERE id = ?',
      [content, id],
      err => {
        if (err) {
          console.log(err);
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            errorCode: 'DATABASE_ERROR',
            message: '할 일 수정에 실패했습니다.',
          });
        }

        // 3. 수정된 할 일 조회
        pool.query(
          'SELECT * FROM todos WHERE id = ?',
          [id],
          (err, updatedTodos) => {
            if (err) {
              console.log(err);
              return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                errorCode: 'DATABASE_ERROR',
                message: '수정된 할 일 조회에 실패했습니다.',
              });
            }

            res.status(StatusCodes.OK).json({
              success: true,
              message: '할 일이 수정되었습니다.',
              todo: updatedTodos[0],
            });
          }
        );
      }
    );
  });
};

const toggleTeamTodo = (req, res) => {
  const id = parseInt(req.params.id);

  // 1. 권한 확인 및 현재 상태 조회
  pool.query('SELECT * FROM todos WHERE id = ?', id, (err, todos) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        errorCode: 'DATABASE_ERROR',
        message: '서버 오류가 발생했습니다.',
      });
    }

    if (todos.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        errorCode: 'NOT_FOUND',
        message: '해당 할일을 찾을 수 없습니다.',
      });
    }

    const currentTodo = todos[0];
    const newIsDone = !currentTodo.is_done;

    // 2. 상태 업데이트
    pool.query(
      'UPDATE todos SET is_done = ? WHERE id = ?',
      [newIsDone, id],
      err => {
        if (err) {
          console.log(err);
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            errorCode: 'DATABASE_ERROR',
            message: '상태 변경에 실패했습니다.',
          });
        }

        res.status(StatusCodes.OK).json({
          success: true,
          message: '완료 상태가 변경되었습니다.',
          todo: {
            id: parseInt(id),
            is_done: newIsDone,
          },
        });
      }
    );
  });
};

const deleteTeamTodo = (req, res) => {
  const id = parseInt(req.params.id);

  const sql = `DELETE FROM todos WHERE id = ?`;
  pool.query(sql, id, function (err, results) {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }

    if (results.affectedRows === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        errorCode: 'NOT_FOUND',
        message: '해당 할일을 찾을 수 없습니다.',
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: '할 일이 삭제되었습니다.',
    });
  });
};

module.exports = {
  getTeamTodos,
  createTeamTodo,
  updateTeamTodo,
  toggleTeamTodo,
  deleteTeamTodo,
};
