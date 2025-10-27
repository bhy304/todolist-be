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

router.use(express.json());

// 팀 만들기
router.post(
  '/',
  authenticateToken,
  validateCreateTeam,
  teamController.createTeam
);
// 팀 삭제
router.delete(
  '/:id',
  authenticateToken,
  validateDeleteTeam,
  teamController.deleteTeam
);
// userId가 가지고 있는 팀 목록
router.get('/', authenticateToken, teamController.getTeams);

// 팀원 초대 (특정 팀에 팀원 추가)
router.post(
  '/:id/members',
  authenticateToken,
  validateInviteTeamMember,
  teamController.inviteTeamMember
);
// 팀원 목록 조회
router.get(
  '/:id/members',
  authenticateToken,
  validateGetTeamMembers,
  teamController.getTeamMembers
);
// 팀원 삭제 (특정 팀에서 특정 팀원 삭제)
router.delete(
  '/:teamId/members/:memberId',
  authenticateToken,
  validateDeleteTeamMember,
  teamController.deleteTeamMember
);

module.exports = router;
