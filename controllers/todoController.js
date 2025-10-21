const pool = require('../mariadb');

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
      return res.status(400).end();
    }

    return res.status(200).json(results);
  });
};

const createTodo = (req, res) => {
  const userId = req.user.id; // 토큰에서 추출한 userId 사용
  const { content } = req.body;

  const sql = `INSERT INTO todos(user_id, content) VALUES (?, ?)`;
  const values = [userId, content];

  pool.query(sql, values, function (err, results) {
    if (err) {
      console.log(err);
      return res.status(400).end();
    }

    return res.status(201).json(results);
  });
};

const updateTodo = (req, res) => {
  let { id } = req.params;
  const userId = req.user.id; // 토큰에서 추출한 userId 사용
  id = parseInt(id);

  const { content, is_done } = req.body;

  if (content === undefined && is_done === undefined) {
    return res.status(400).json({
      message: '수정할 내용을 입력해주세요.',
    });
  }

  //SQL 쿼리 생성 (본인의 할일만 수정 가능하도록 user_id 조건 추가)
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
      return res.status(400).end();
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({
        message: '해당 할일을 찾을 수 없거나 수정 권한이 없습니다.',
      });
    } else {
      const selectSql = `SELECT * FROM todos WHERE id = ?`;
      pool.query(selectSql, id, function (err, results) {
        if (err) {
          console.log(err);
          return res.status(400).end();
        }
        res.status(200).json(results);
      });
    }
  });
};

const deleteTodo = (req, res) => {
  let { id } = req.params;
  const userId = req.user.id; // 토큰에서 추출한 userId 사용
  id = parseInt(id);

  // 본인의 할일만 삭제 가능하도록 user_id 조건 추가
  const sql = `DELETE FROM todos WHERE id = ? AND user_id = ?`;
  pool.query(sql, [id, userId], function (err, results) {
    if (err) {
      console.log(err);
      return res.status(400).end();
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({
        message: '해당 할일을 찾을 수 없거나 삭제 권한이 없습니다.',
      });
    } else {
      res.status(200).json({
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
