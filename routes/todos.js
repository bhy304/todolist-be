const express = require("express");
const router = express.Router();
const connection = require("../mariadb");
const { body, param, validationResult } = require("express-validator");

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

router.route("/");
// 할일 전체 조회, 추가
router
  .route("/")

  .get(
    // 특정 유저의 할일 전체 조회
    [
      body("userId")
        .notEmpty()
        .isInt()
        .withMessage("userId는 숫자여야 합니다."),
      validate,
    ],
    (req, res) => {
      const { userId } = req.body;

      // userId에 해당하는 할일만 조회 (개인 + 팀 할일 모두)
      const sql = `SELECT * FROM todos WHERE user_id = ? OR team_id IN 
                   (SELECT team_id FROM team_members WHERE user_id = ?) 
                   ORDER BY created_at DESC`;

      connection.query(sql, [userId, userId], function (err, results) {
        if (err) {
          console.log(err);
          return res.status(400).end();
        }

        if (results.length) {
          res.status(200).json(results);
        } else {
          return res.status(400).end();
        }
      });
    }
  )

  //할 일 등록 api
  .post(
    [
      body("userId")
        .notEmpty()
        .isInt()
        .withMessage("userId는 숫자여야 합니다."),
      body("title")
        .notEmpty()
        .withMessage("할 일 제목을 입력해주세요.")
        .isLength({ max: 255 })
        .withMessage("제목은 255자 이내로 입력해주세요"),
      body("teamId")
        .optional()
        .isInt()
        .withMessage("teamId는 숫자여야 합니다."),
      validate,
    ],
    (req, res) => {
      const { userId, title, teamId } = req.body;

      const sql = `INSERT INTO todos(user_id, team_id, title, is_done) VALUES (?, ?, ?, FALSE)`;
      const values = [userId, teamId || null, title];

      connection.query(sql, values, function (err, results) {
        if (err) {
          console.log(err);
          return res.status(400).end();
        }

        //등록된 할일을 조회해서 반환
        const selectSql = `SELECT * FROM todos WHERE id = ?`;
        connection.query(selectSql, [results.insertId], function (err, todo) {
          if (err) {
            console.log(err);
            return res.status(400).end();
          }
          res.status(201).json(todo[0]);
        });
      });
    }
  );

// 여기서 할일 개별id로 조회하고, 수정하고, 삭제하고
router
  .route("/:id")
  // 할일 개별 조회
  .get(
    [param("id").notEmpty().withMessage("할 일 id 필요해"), validate],
    (req, res) => {
      let { id } = req.params;
      id = parseInt(id);

      const sql = `SELECT * FROM todos WHERE id = ?`;
      connection.query(sql, id, function (err, results) {
        if (err) {
          console.log(err);
          return res.status(400).end();
        }

        if (results.length) {
          res.status(200).json(results[0]);
        } else {
          res.status(404).json({
            message: "해당 할일을 찾을 수 없어요",
          });
        }
      });
    }
  );

// .put(

//   [
//     param("id").notEmpty().withMessage("할 일 id 필요해"), validate
//   ],
//     (req, res) => {
//       let {id} = req.params;
//       id = parseInt(id);

//       const { title, is_done } = req.body;

//     }

// )

module.exports = router;
