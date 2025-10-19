const express = require('express');
const router = express.Router();
const connection = require('../mariadb');
const { body, param, validationResult } = require('express-validator');

router.use(express.json());

//여기서 유효성 검사해.미들웨어
const validate = (req, res, next) => {
  const err = validationResult(req);

  if (err.isEmpty()) {
    return next();
  } else {
    return res.status(400).json(err.array());
  }
};

// 할일 전체 조회, 추가
router
  .route('/')

  .get(
    // 특정 유저의 할일 전체 조회
    [
      body('userId')
        .notEmpty()
        .isInt()
        .withMessage('userId는 숫자여야 합니다.'),
      validate,
    ],
    (req, res) => {
      const { userId } = req.body;

      // userId에 해당하는 할일만 조회 (개인 + 팀 할일 모두)  LEFT JOIN
      const sql = `SELECT DISTINCT t.*
        FROM todos t
        LEFT JOIN team_members tm ON t.team_id = tm.teams_id AND tm.users_id = ?
        WHERE t.user_id = ? OR tm.users_id IS NOT NULL
        ORDER BY t.created_at DESC`;

      connection.query(sql, [userId, userId], function (err, results) {
        if (err) {
          console.log(err);
          return res.status(400).end();
        }

        if (results.length) {
          res.status(200).json(results);
        } else {
          console.log(err);
          return res.status(400).end();
        }
      });
    }
  )

  //할 일 등록 api
  .post(
    [
      body('userId')
        .notEmpty()
        .isInt()
        .withMessage('userId는 숫자여야 합니다.'),
      body('content')
        .notEmpty()
        .withMessage('할 일 제목을 입력해주세요.')
        .isLength({ max: 255 })
        .withMessage('제목은 255자 이내로 입력해주세요'),
      validate,
    ],
    (req, res) => {
      const { userId, content } = req.body;

      const sql = `INSERT INTO todos(user_id,  content) VALUES (?, ?)`;
      const values = [userId, content];

      connection.query(sql, values, function (err, results) {
        if (err) {
          console.log(err);
          return res.status(400).end();
        }

        return res.status(201).json(results);
      });
    }
  );

// 여기서 할일 개별id로 조회하고, 수정하고, 삭제하고
router
  .route('/:id')
  // 할일 상세 조회
  /*
  .get(
    [
      param('id').notEmpty().withMessage('할 일 id 필요해'),
      body('userId')
        .notEmpty()
        .isInt()
        .withMessage('userId는 숫자여야 합니다.'),
      validate,
    ],
    (req, res) => {
      let { id } = req.params;
      const { userId } = req.body;
      id = parseInt(id);

       const sql = `SELECT DISTINCT t.*
        FROM todos t
        LEFT JOIN team_members tm ON t.team_id = tm.teams_id AND tm.users_id = ?
        WHERE t.id = ? AND (t.user_id = ? OR tm.users_id IS NOT NULL)`;
      
      connection.query(sql, [userId, id, userId], function (err, results) {
        if (err) {
          console.log(err);
          return res.status(400).end();
        }

        if (results.length) {
          res.status(200).json(results[0]);
        } else {
          res.status(404).json({
            message: '해당 할일을 찾을 수 없어요',
          });
        }
      });
    }
  )

  */

  //할일 수정
  .put(
    [param('id').notEmpty().withMessage('할 일 id 필요해'), validate],
    (req, res) => {
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

      connection.query(sql, values, function (err, results) {
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
          connection.query(selectSql, id, function (err, results) {
            if (err) {
              console.log(err);
              return res.status(400).end();
            }
            res.status(200).json(results);
          });
        }
      });
    }
  )
  //할 일 삭제
  .delete(
    [param('id').notEmpty().withMessage('할일 id 필요'), validate],
    (req, res) => {
      let { id } = req.params;
      id = parseInt(id);

      const sql = `DELETE FROM todos WHERE id = ?`;
      connection.query(sql, id, function (err, results) {
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
    }
  );

// 1. put쪽 로직 다시 손 봐야할듯 너무 if문 남발.
// 2. if(err) 이것과 affetedRows 부분 중복 해결하기.
// 3. 제대로 작동하는지 db되면 다시 확인해보자.
// sql utc + 9시간 추가하기.
module.exports = router;
