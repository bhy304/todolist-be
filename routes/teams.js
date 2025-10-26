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
// 팀 초대 (팀원의 아이디를 입력해서 팀원 초대)
router.post(
  '/invite',
  authenticateToken,
  validateInviteTeamMember,
  teamController.inviteTeamMember
);
// userId가 가지고 있는 팀 목록
router.get('/', authenticateToken, teamController.getTeams);
// 팀원 삭제
router.delete(
  '/members/:id',
  authenticateToken,
  validateDeleteTeamMember,
  teamController.deleteTeamMember
);
// 팀원 목록 조회
router.get(
  '/members/:id',
  authenticateToken,
  validateGetTeamMembers,
  teamController.getTeamMembers
);

module.exports = router;
