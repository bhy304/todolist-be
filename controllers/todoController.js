const pool = require('../mariadb');

const getTodos = (req, res) => {
  const { userId } = req.body;

  // userId에 해당하는 할일만 조회 (개인 + 팀 할일 모두)  LEFT JOIN
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

    if (results.length) {
      res.status(200).json(results);
    }
  });
};

const createTodo = (req, res) => {
  const { userId, content } = req.body;

  const sql = `INSERT INTO todos(user_id,  content) VALUES (?, ?)`;
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
  id = parseInt(id);

  const { content, is_done } = req.body;

  if (content === undefined && is_done === undefined) {
    return res.status(400).json({
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

  sql = sql.slice(0, -2) + ` WHERE id = ?`;
  values.push(id);

  pool.query(sql, values, function (err, results) {
    if (err) {
      console.log(err);
      return res.status(400).end();
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({
        message: '해당 할일을 찾을 수 없습니다.',
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
  id = parseInt(id);

  const sql = `DELETE FROM todos WHERE id = ?`;
  pool.query(sql, id, function (err, results) {
    if (err) {
      console.log(err);
      return res.status(400).end();
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({
        message: '해당 할일을 찾을 수 없습니다.',
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
