const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todoController');
const {
  authenticateToken,
  validateCreateTodo,
  validateUpdateTodo,
  validateToggleTodo,
  validateDeleteTodo,
} = require('../middleware/validators');

router.use(express.json());

router
  .route('/')
  .get(authenticateToken, todoController.getTodos)
  .post(authenticateToken, validateCreateTodo, todoController.createTodo);

router
  .route('/:id')
  .put(authenticateToken, validateUpdateTodo, todoController.updateTodo)
  .delete(authenticateToken, validateDeleteTodo, todoController.deleteTodo);

router.patch(
  '/:id/toggle',
  authenticateToken,
  validateToggleTodo,
  todoController.toggleTodo
);

module.exports = router;
