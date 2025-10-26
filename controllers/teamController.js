const pool = require('../mariadb');
const { StatusCodes } = require('http-status-codes');

const createTeam = (req, res) => {
  const userId = req.user.id;
  const { teamname } = req.body;

  const sql = 'INSERT INTO teams (teamname, owner_id) VALUES (?, ?)';
  // 팀 생성
  pool.query(sql, [teamname, userId], (err, results) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }

    // owner를 팀 멤버로 추가
    const memberSql = `INSERT INTO team_members (teams_id, users_id) VALUES (?, ?)`;
    pool.query(memberSql, [results.insertId, userId], (err, memberResults) => {
      if (err) {
        console.log(err);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          errorCode: 'DATABASE_ERROR',
          message: '팀 멤버 추가에 실패했습니다.',
        });
      }
      console.log(results, memberResults);

      return res.status(StatusCodes.CREATED).json(results);
    });
  });
};

const deleteTeam = (req, res) => {
  const userId = req.user.id;
  const id = parseInt(req.params.id);

  // 팀 삭제 전에 팀 소유자 확인
  const ownerCheckSql = 'SELECT owner_id FROM teams WHERE id = ?';
  pool.query(ownerCheckSql, [id], (err, checkResult) => {
    // 팀 존재
    if (err) {
      console.log(err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        errorCode: 'DATABASE_ERROR',
        message: '서버 오류가 발생했습니다.',
      });
    }

    console.log(checkResult);

    if (checkResult.length && checkResult[0].owner_id !== userId) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        errorCode: 'NOT_FOUND',
        message: '해당 팀을 찾을 수 없거나 삭제 권한이 없습니다.',
      });
    }

    // 팀이 삭제되면 팀에 속한 모든 팀원과 팀 할일도 함께 삭제되어야 함
    const sql = 'DELETE FROM teams WHERE id = ? AND owner_id = ?';
    pool.query(sql, [id, checkResult[0].owner_id], (err, results) => {
      if (err) {
        console.log(err);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          errorCode: 'DATABASE_ERROR',
          message: '서버 오류가 발생했습니다.',
        });
      }

      return res.status(StatusCodes.OK).json(results);
    });
  });
};

const getTeams = (req, res) => {
  const userId = req.user.id;
  const sql = `SELECT t.id, t.teamname
              FROM team_members tm
              INNER JOIN teams t ON tm.teams_id = t.id
              WHERE tm.users_id = ?
              ORDER BY t.id ASC`;

  pool.query(sql, userId, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        errorCode: 'DATABASE_ERROR',
        message: '서버 오류가 발생했습니다.',
      });
    }

    return res.status(StatusCodes.OK).json(results);
  });
};

const inviteTeamMember = (req, res) => {
  const userId = req.user.id;
  const { username } = req.body;

  const sql = `INSERT INTO team_members (teams_id, users_id)
              SELECT t.id, u.id
              FROM teams t,
                  (SELECT id FROM users WHERE username = ?) u
              WHERE t.owner_id = ?
              AND NOT EXISTS (
                  SELECT 1
                  FROM team_members tm
                  WHERE tm.teams_id = t.id
                  AND tm.users_id = u.id)`;

  pool.query(sql, [username, userId], (err, results) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        errorCode: 'DATABASE_ERROR',
        message: '서버 오류가 발생했습니다.',
      });
    }

    // affectedRows가 0이면 추가되지 않은 것
    if (results.affectedRows === 0) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        errorCode: 'ALREADY_MEMBER',
        message: '이미 팀에 속한 사용자이거나 존재하지 않는 사용자입니다.',
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: '팀원이 추가되었습니다.',
      data: results,
    });
  });
};

// 팀원 삭제 (팀 소유자만 팀원을 삭제할 수 있음, 단 자기 자신은 삭제 불가)
const deleteTeamMember = (req, res) => {
  const userId = req.user.id; // 요청한 사용자 (팀 소유자인지 확인 필요)
  const memberId = parseInt(req.params.id); // 삭제할 팀원의 id

  // 1. 자기 자신을 삭제하려는 경우 방지
  if (userId === memberId) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      errorCode: 'CANNOT_DELETE_SELF',
      message: '팀 소유자는 자기 자신을 삭제할 수 없습니다.',
    });
  }

  // 2. 삭제하려는 팀원이 속한 팀 정보와 팀 소유자 확인
  const checkSql = `
    SELECT tm.id as member_id, tm.teams_id, t.owner_id
    FROM team_members tm
    INNER JOIN teams t ON tm.teams_id = t.id
    WHERE tm.users_id = ?
  `;

  pool.query(checkSql, [memberId], (err, results) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        errorCode: 'DATABASE_ERROR',
        message: '서버 오류가 발생했습니다.',
      });
    }

    // 팀원이 존재하지 않음
    if (results.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        errorCode: 'MEMBER_NOT_FOUND',
        message: '해당 팀원을 찾을 수 없습니다.',
      });
    }

    const memberInfo = results[0];

    // 3. 요청한 사용자가 팀 소유자인지 확인
    if (memberInfo.owner_id !== userId) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        errorCode: 'NO_PERMISSION',
        message:
          '팀원을 삭제할 권한이 없습니다. 팀 소유자만 팀원을 삭제할 수 있습니다.',
      });
    }

    // 4. 팀원 삭제
    const deleteSql = 'DELETE FROM team_members WHERE id = ?';
    pool.query(deleteSql, [memberInfo.member_id], (err, deleteResults) => {
      if (err) {
        console.log(err);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          errorCode: 'DATABASE_ERROR',
          message: '팀원 삭제에 실패했습니다.',
        });
      }

      return res.status(StatusCodes.OK).json({
        success: true,
        message: '팀원이 삭제되었습니다.',
        data: {
          deletedMemberId: memberId,
          teamId: memberInfo.teams_id,
        },
      });
    });
  });
};

const getTeamMembers = (req, res) => {
  const teamId = parseInt(req.params.id); // 또는 req.params.teamId
  // 팀원 목록 조회 (users_id에 해당하는 username도 함께 조회)
  const sql = `SELECT tm.id, tm.teams_id, tm.users_id, u.username
                FROM team_members tm
                INNER JOIN users u ON tm.users_id = u.id
                INNER JOIN teams t ON tm.teams_id = t.id
                WHERE tm.teams_id = ?
                ORDER BY u.username ASC`;

  pool.query(sql, [teamId], (err, results) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        errorCode: 'DATABASE_ERROR',
        message: '서버 오류가 발생했습니다.',
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      data: results,
    });
  });
};

module.exports = {
  createTeam,
  deleteTeam,
  getTeams,
  inviteTeamMember,
  deleteTeamMember,
  getTeamMembers,
};
