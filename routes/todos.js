const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todoController');
const {
  authenticateToken,
  validateCreateTodo,
  validateUpdateTodo,
  validateDeleteTodo,
} = require('../middleware/validators');

router.get('/', authenticateToken, todoController.getTodos);
router.post(
  '/',
  authenticateToken,
  validateCreateTodo,
  todoController.createTodo
);
router.put(
  '/:id',
  authenticateToken,
  validateUpdateTodo,
  todoController.updateTodo
);
router.delete(
  '/:id',
  authenticateToken,
  validateDeleteTodo,
  todoController.deleteTodo
);

module.exports = router;
