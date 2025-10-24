const pool = require('../mariadb');
const { StatusCodes } = require('http-status-codes');

const getTodos = (req, res) => {
  const userId = req.user.id; // 토큰에서 추출한 userId 사용

  const sql = `SELECT DISTINCT t.*
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
      return res.status(StatusCodes.NO_CONTENT).end();
    }
    return res.status(StatusCodes.OK).json(results);
  });
};

const createTodo = (req, res) => {
  const userId = req.user.id;
  const { content } = req.body;

  const sql = `INSERT INTO todos(user_id,  content) VALUES (?, ?)`;

  pool.query(sql, [userId, content], function (err, results) {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }

    return res.status(StatusCodes.CREATED).json(results);
  });
};

const updateTodo = (req, res) => {
  let { id } = req.params;
  id = parseInt(id);
  const userId = req.user.id;

  const { content, is_done } = req.body;

  if (content === undefined && is_done === undefined) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: '수정할 내용을 입력해주세요.',
    });
  }

  //SQL 쿼리 생성
  let sql = `UPDATE todos SET `;
  let values = [];

  if (content !== undefined) {
    sql += `content = ?, `;
    values.push(content);
  }

  if (is_done !== undefined) {
    sql += `is_done = ?, `;
    values.push(is_done);
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
      const selectSql = `SELECT * FROM todos WHERE id = ?`;
      pool.query(selectSql, id, function (err, results) {
        if (err) {
          console.log(err);
          return res.status(StatusCodes.BAD_REQUEST).end();
        }
        res.status(StatusCodes.OK).json(results);
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
