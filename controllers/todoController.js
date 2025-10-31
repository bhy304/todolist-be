const pool = require('../mariadb');
const { StatusCodes } = require('http-status-codes');
const { handleError } = require('../middleware/errorHandler');

const getTodos = async (req, res) => {
  try {
    const userId = req.user.id;
    const teamId = req.query.teamId;

    const sql = `SELECT * FROM todos
                  WHERE user_id = ? AND team_id ${teamId ? '= ?' : 'IS NULL'}
                  ORDER BY id ASC`;
    const values = teamId ? [userId, teamId] : [userId];
    const [results] = await pool.query(sql, values);

    return res.status(StatusCodes.OK).json(results);
  } catch (error) {
    console.log(error);
    return res.status(StatusCodes.BAD_REQUEST).end();
  }
};

const createTodo = async (req, res) => {
  try {
    const userId = req.user.id;
    const teamId = req.query.teamId;
    const { content } = req.body;

    const sql = `INSERT INTO todos(user_id, team_id, content) VALUES (?, ${teamId ? '?' : 'NULL'}, ?) RETURNING *`;
    const values = teamId ? [userId, teamId, content] : [userId, content];
    const [results] = await pool.query(sql, values);

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: '할 일이 생성되었습니다.',
      todo: results[0],
    });
  } catch (error) {
    handleError(error, res);
  }
};

const updateTodo = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { content, is_done } = req.body;

    const [results] = await pool.query(
      'UPDATE todos SET content = ?, is_done = ? WHERE id = ?',
      [content, is_done, id]
    );

    if (results.affectedRows === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        errorCode: 'NOT_FOUND',
        message: '해당 할일을 찾을 수 없거나 수정 권한이 없습니다.',
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: '할 일이 수정되었습니다.',
    });
  } catch (error) {
    handleError(error, res);
  }
};

const deleteTodo = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const sql = `DELETE FROM todos WHERE id = ?`;
    const [results] = await pool.query(sql, [id]);

    if (results.affectedRows === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        errorCode: 'NOT_FOUND',
        message: '해당 할일을 찾을 수 없거나 삭제 권한이 없습니다.',
      });
    }

    return res.status(StatusCodes.OK).json({
      message: '할 일이 삭제되었습니다.',
    });
  } catch (error) {
    console.log(error);
    return res.status(StatusCodes.BAD_REQUEST).end();
  }
};

module.exports = {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
};
