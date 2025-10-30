const pool = require('../mariadb');
const { StatusCodes } = require('http-status-codes');
const { handleError } = require('../middleware/errorHandler');

const createTeam = async (req, res) => {
  const connection = await pool.getConnection();
  const userId = req.user.id;
  const { teamname } = req.body;

  try {
    await connection.beginTransaction();

    const [teamResult] = await connection.query(
      'INSERT INTO teams (teamname, owner_id) VALUES (?, ?)',
      [teamname, userId]
    );

    const teamId = teamResult.insertId;

    await connection.query(
      'INSERT INTO team_members (teams_id, users_id) VALUES (?, ?)',
      [teamId, userId]
    );

    await connection.commit();

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: '팀이 생성되었습니다.',
      data: {
        teamId,
        teamname,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.log(error);
    handleError(error, res, '팀 생성에 실패했습니다.');
  } finally {
    connection.release();
  }
};

const deleteTeam = async (req, res) => {
  const connection = await pool.getConnection();
  const userId = req.user.id;
  const teamId = parseInt(req.params.id);

  try {
    await connection.beginTransaction();

    // 팀 삭제 전에 팀 소유자 확인
    const [checkResult] = await connection.query(
      'SELECT owner_id FROM teams WHERE id = ?',
      [teamId]
    );

    // 팀이 존재하지 않음
    if (checkResult.length === 0) {
      await connection.rollback();
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        errorCode: 'TEAM_NOT_FOUND',
        message: '해당 팀을 찾을 수 없습니다.',
      });
    }

    // 소유자가 아님
    if (checkResult[0].owner_id !== userId) {
      await connection.rollback();
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        errorCode: 'NO_PERMISSION',
        message: '팀 삭제 권한이 없습니다.',
      });
    }

    // 팀이 삭제되면 팀에 속한 모든 팀원과 팀 할일도 함께 삭제되어야 함
    const [results] = await connection.query('DELETE FROM teams WHERE id = ?', [
      teamId,
    ]);
    await connection.commit();
    return res.status(StatusCodes.OK).json({
      success: true,
      message: '팀이 삭제되었습니다.',
      data: results,
    });
  } catch (error) {
    await connection.rollback();
    handleError(error, res, '팀 삭제에 실패했습니다.');
  } finally {
    connection.release();
  }
};

const getTeams = async (req, res) => {
  try {
    const userId = req.user.id;
    const [results] = await pool.query(
      `SELECT t.id, t.teamname,
        CASE WHEN t.owner_id = ? THEN true ELSE false END as is_owner
        FROM team_members tm
        INNER JOIN teams t ON tm.teams_id = t.id
        WHERE tm.users_id = ?
        ORDER BY t.id ASC`,
      [userId, userId]
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      data: results,
    });
  } catch (error) {
    handleError(error, res);
  }
};

const inviteTeamMember = async (req, res) => {
  try {
    const userId = req.user.id;
    const teamId = parseInt(req.params.id);
    const { username } = req.body;

    const [results] = await pool.query(
      `INSERT INTO team_members (teams_id, users_id)
        SELECT t.id, u.id
        FROM teams t,
          (SELECT id FROM users WHERE username = ?) u
        WHERE t.id = ?
        AND t.owner_id = ?
        AND NOT EXISTS (
          SELECT 1
          FROM team_members tm
          WHERE tm.teams_id = t.id
          AND tm.users_id = u.id
        )`,
      [username, teamId, userId]
    );

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
    });
  } catch (error) {
    handleError(error, res);
  }
};

// 팀원 삭제 (팀 소유자만 팀원을 삭제할 수 있음, 단 자기 자신은 삭제 불가)
const deleteTeamMember = async (req, res) => {
  try {
    const userId = req.user.id; // 요청한 사용자 (팀 소유자인지 확인 필요)
    const teamId = parseInt(req.params.teamId);
    const memberId = parseInt(req.params.memberId);

    // 1. 자기 자신을 삭제하려는 경우 방지
    if (userId === memberId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        errorCode: 'CANNOT_DELETE_SELF',
        message: '팀 소유자는 삭제할 수 없습니다.',
      });
    }

    // 2. 특정 팀에서 특정 팀원 정보와 팀 소유자 확인
    const [results] = await pool.query(
      `
      SELECT tm.id as member_id, t.owner_id
      FROM team_members tm
      INNER JOIN teams t ON tm.teams_id = t.id
      WHERE tm.teams_id = ? AND tm.users_id = ?
    `,
      [teamId, memberId]
    );

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
    await pool.query('DELETE FROM team_members WHERE id = ?', [
      memberInfo.member_id,
    ]);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: '팀원이 삭제되었습니다.',
      data: {
        deletedMemberId: memberId,
        teamId: teamId,
      },
    });
  } catch (error) {
    handleError(error, res);
  }
};

const getTeamMembers = async (req, res) => {
  try {
    const userId = req.user.id;
    const teamId = parseInt(req.params.id);

    // 1. 요청자가 해당 팀의 멤버인지 확인
    const [members] = await pool.query(
      `SELECT * FROM team_members WHERE teams_id = ? AND users_id = ?`,
      [teamId, userId]
    );

    if (members.length === 0) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        errorCode: 'NO_PERMISSION',
        message: '해당 팀에 접근 권한이 없습니다.',
      });
    }

    // 2. 팀원 목록 조회 (owner 정보 포함)
    const sql = `SELECT tm.id, tm.teams_id, tm.users_id, u.username,
                    CASE WHEN t.owner_id = tm.users_id
                    THEN true ELSE false END as is_owner
                  FROM team_members tm
                  INNER JOIN users u ON tm.users_id = u.id
                  INNER JOIN teams t ON tm.teams_id = t.id
                  WHERE tm.teams_id = ?
                  ORDER BY is_owner DESC, u.username ASC`;

    const [results] = await pool.query(sql, [teamId]);

    return res.status(StatusCodes.OK).json({
      success: true,
      data: results,
    });
  } catch (error) {
    handleError(error, res);
  }
};

module.exports = {
  createTeam,
  deleteTeam,
  getTeams,
  inviteTeamMember,
  deleteTeamMember,
  getTeamMembers,
};
