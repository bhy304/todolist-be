const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todoController');
const {
  validateGetTodos,
  validateCreateTodo,
  validateUpdateTodo,
  validateDeleteTodo,
} = require('../middleware/validators');
const pool = require('../mariadb');

router.use(express.json());

router
  .route('/')
  .get((req, res) => {
    const sql = 'SELECT * FROM todos';
    pool.query(sql, (err, results) => {
      if (err) {
        console.log(err);
        return res.status(400).end();
      }
      res.status(200).json(results);
    });
  })
  .get(validateGetTodos, todoController.getTodos)
  .post(validateCreateTodo, todoController.createTodo);

router
  .route('/:id')
  .put(validateUpdateTodo, todoController.updateTodo)
  .delete(validateDeleteTodo, todoController.deleteTodo);

module.exports = router;
