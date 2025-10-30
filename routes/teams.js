const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');

const {
  authenticateToken,
  validateCreateTeam,
  validateDeleteTeam,
  validateInviteTeamMember,
  validateDeleteTeamMember,
  validateGetTeamMembers,
} = require('../middleware/validators');

router.get('/', authenticateToken, teamController.getTeams);
router.post(
  '/',
  authenticateToken,
  validateCreateTeam,
  teamController.createTeam
);
router.delete(
  '/:id',
  authenticateToken,
  validateDeleteTeam,
  teamController.deleteTeam
);
router.post(
  '/:id/members',
  authenticateToken,
  validateInviteTeamMember,
  teamController.inviteTeamMember
);
router.get(
  '/:id/members',
  authenticateToken,
  validateGetTeamMembers,
  teamController.getTeamMembers
);
router.delete(
  '/:teamId/members/:memberId',
  authenticateToken,
  validateDeleteTeamMember,
  teamController.deleteTeamMember
);

module.exports = router;
