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
    if (!results || results.length === 0) {
      return res.status(StatusCodes.OK).json([]);
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

    // 방금 생성된 todo 조회
    const selectSql = `SELECT id, user_id, content, is_done as isDone, created_at FROM todos WHERE id = ?`;
    pool.query(selectSql, [results.insertId], function (err, todos) {
      if (err) {
        console.log(err);
        return res.status(StatusCodes.BAD_REQUEST).end();
      }
      
      return res.status(StatusCodes.CREATED).json({
        todo: todos[0]
      });
    });
  });
};

const updateTodo = (req, res) => {
  let { id } = req.params;
  id = parseInt(id);
  const userId = req.user.id;

  const { content, isDone } = req.body;

  if (content === undefined && isDone === undefined) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: '수정할 내용을 입력해주세요.',
    });
  }

  let sql = `UPDATE todos SET `;
  let values = [];

  if (content !== undefined) {
    sql += `content = ?, `;
    values.push(content);
  }

  if (isDone !== undefined) {
    sql += `is_done = ?, `;
    values.push(isDone);
  }

  sql = sql.slice(0, -2) + ` WHERE id = ? AND user_id = ?`;
  values.push(id, userId);

  pool.query(sql, values, function (err, results) {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }

    if (results.affectedRows === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: '해당 할일을 찾을 수 없거나 수정 권한이 없습니다.',
      });
    } else {
      const selectSql = `SELECT id, user_id, content, is_done as isDone, created_at FROM todos WHERE id = ?`;
      pool.query(selectSql, [id], function (err, todos) {
        if (err) {
          console.log(err);
          return res.status(StatusCodes.BAD_REQUEST).end();
        }
        res.status(StatusCodes.OK).json(todos[0]);
      });
    }
  });
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
  deleteTodo,
};