const express = require('express');
const router = express.Router();
const teamTodoController = require('../controllers/teamTodoController');
const {
  authenticateToken,
  validateCreateTodo,
  validateUpdateTodo,
  validateToggleTodo,
  validateDeleteTodo,
} = require('../middleware/validators');

router.use(express.json());

router
  .route('/:id')
  .get(authenticateToken, teamTodoController.getTeamTodos)
  .post(
    authenticateToken,
    validateCreateTodo,
    teamTodoController.createTeamTodo
  );

router
  .route('/:id')
  .put(authenticateToken, validateUpdateTodo, teamTodoController.updateTeamTodo)
  .delete(
    authenticateToken,
    validateDeleteTodo,
    teamTodoController.deleteTeamTodo
  );

router.patch(
  '/:id/toggle',
  authenticateToken,
  validateToggleTodo,
  teamTodoController.toggleTeamTodo
);

module.exports = router;
