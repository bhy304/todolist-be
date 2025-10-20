const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todoController');
const {
  validateGetTodos,
  validateCreateTodo,
  validateUpdateTodo,
  validateDeleteTodo,
} = require('../middleware/validators');

router.use(express.json());

router
  .route('/')
  .get(validateGetTodos, todoController.getTodos)
  .post(validateCreateTodo, todoController.createTodo);

router
  .route('/:id')
  .put(validateUpdateTodo, todoController.updateTodo)
  .delete(validateDeleteTodo, todoController.deleteTodo);

module.exports = router;
