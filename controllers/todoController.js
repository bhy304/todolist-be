const pool = require('../mariadb');
const { StatusCodes } = require('http-status-codes');

const getTodos = (req, res) => {
  const userId = req.user.id;

  const sql = `SELECT DISTINCT t.id, t.user_id, t.content, t.is_done as isDone, t.created_at, t.team_id
        FROM todos t
        LEFT JOIN team_members tm ON t.team_id = tm.teams_id AND tm.users_id = ?
        WHERE t.user_id = ? OR tm.users_id IS NOT NULL
        ORDER BY t.created_at DESC`;

  pool.query(sql, [userId, userId], function (err, results) {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }

    return res.status(StatusCodes.OK).json(results);
  });
};

const createTodo = (req, res) => {
  const userId = req.user.id;
  const { content } = req.body;

  const sql = `INSERT INTO todos(user_id, content, is_done) VALUES (?, ?, 0)`;

  pool.query(sql, [userId, content], function (err, results) {
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

const updateTodo = (req, res) => {
  let { id } = req.params;
  id = parseInt(id);
  const userId = req.user.id;

  const { content } = req.body;

  if (!content || content.trim() === '') {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: '수정할 내용을 입력해주세요.',
    });
  }

  // 1. 권한 확인
  pool.query(
    'SELECT * FROM todos WHERE id = ? AND user_id = ?',
    [id, userId],
    (err, todos) => {
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
          message: '해당 할일을 찾을 수 없거나 수정 권한이 없습니다.',
        });
      }

      // 2. 업데이트 실행
      pool.query(
        'UPDATE todos SET content = ? WHERE id = ?',
        [content, id],
        (err, results) => {
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
    }
  );
};

const toggleTodo = (req, res) => {
  const id = parseInt(req.params.id);
  const userId = req.user.id;

  // 1. 권한 확인 및 현재 상태 조회
  pool.query(
    'SELECT * FROM todos WHERE id = ? AND user_id = ?',
    [id, userId],
    (err, todos) => {
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
          message: '해당 할일을 찾을 수 없거나 수정 권한이 없습니다.',
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
    }
  );
};

const deleteTodo = (req, res) => {
  let { id } = req.params;
  id = parseInt(id);
  const userId = req.user.id;

  const sql = `DELETE FROM todos WHERE id = ? AND user_id = ?`;
  pool.query(sql, [id, userId], function (err, results) {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }

    if (results.affectedRows === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: '해당 할일을 찾을 수 없거나 삭제 권한이 없습니다.',
      });
    } else {
      res.status(StatusCodes.OK).json({
        message: '할 일이 삭제되었습니다.',
      });
    }
  });
};

module.exports = {
  getTodos,
  createTodo,
  updateTodo,
  toggleTodo,
  deleteTodo,
};
