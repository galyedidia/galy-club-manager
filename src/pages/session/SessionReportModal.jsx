import { motion } from "framer-motion"
import { getPlayerRank } from "../../utils/matchmaking"

export default function SessionReportModal({ allClubPlayersDocs, session, isEn, done, onPlayerClick }) {
  const backdropVar = {
    hidden: { opacity: 0, transition: { duration: 0.15 } },
    visible: { opacity: 1 },
    exit: { opacity: 0, transition: { duration: 0.15 } }
  }
  const modalVar = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3, type: "spring" } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.15 } }
  }

  // Calculate stats for all players in this session
  const statsMap = {}
  const doneGames = session?.doneGames || []

  // Initialize all players who are or were in session
  allClubPlayersDocs?.forEach((p) => {
    if (p.inSession || (p.gamesInSession && p.gamesInSession > 0)) {
      statsMap[p.id] = {
        id: p.id,
        name: `${p.firstName} ${p.familyName || ""}`.trim(),
        rank: getPlayerRank(p.id, allClubPlayersDocs),
        total: 0,
        balanced: 0,
        challenge: 0,
        mentoring: 0
      }
    }
  })

  // Process all done games
  doneGames.forEach((game) => {
    const processTeam = (team) => {
      if (!team || team.length < 2) return
      const [p1Id, p2Id] = team
      const r1 = getPlayerRank(p1Id, allClubPlayersDocs)
      const r2 = getPlayerRank(p2Id, allClubPlayersDocs)

      const updatePlayer = (pId, partnerId, myR, partR) => {
        if (!statsMap[pId]) {
          const p = allClubPlayersDocs?.find((x) => x.id === pId)
          statsMap[pId] = {
            id: pId,
            name: p ? `${p.firstName} ${p.familyName || ""}`.trim() : pId,
            rank: myR,
            total: 0,
            balanced: 0,
            challenge: 0,
            mentoring: 0
          }
        }
        statsMap[pId].total++
        const diff = partR - myR
        if (diff >= 2) statsMap[pId].challenge++
        else if (diff <= -2) statsMap[pId].mentoring++
        else statsMap[pId].balanced++
      }

      updatePlayer(p1Id, p2Id, r1, r2)
      updatePlayer(p2Id, p1Id, r2, r1)
    }

    processTeam(game.winTeam)
    processTeam(game.loseTeam)
  })

  const playerStatsList = Object.values(statsMap)
    .filter((p) => p.total > 0)
    .sort((a, b) => b.rank - a.rank || b.total - a.total)

  let totalSlots = 0
  let totalBalanced = 0
  let totalChallenge = 0
  let totalMentoring = 0

  playerStatsList.forEach((p) => {
    totalSlots += p.total
    totalBalanced += p.balanced
    totalChallenge += p.challenge
    totalMentoring += p.mentoring
  })

  const calcPct = (count) => (totalSlots > 0 ? Math.round((count / totalSlots) * 100) : 0)

  return (
    <motion.div
      className="modal-background"
      variants={backdropVar}
      initial="hidden"
      animate="visible"
      exit="hidden"
      onClick={done}
      style={{ direction: isEn ? "ltr" : "rtl" }}
    >
      <motion.div
        variants={modalVar}
        className="session-report-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="btn add-players-modal-done" onClick={done}>
          X
        </button>
        <h2 className="session-report-title">
          📊 {isEn ? "Session Matchmaking Report" : "דוח סוגי משחקים באימון"}
        </h2>

        {/* Summary Badges Header */}
        <div className="session-report-summary-bar">
          <div className="report-summary-card report-card-balanced">
            <span className="report-card-icon">🟢</span>
            <div className="report-card-info">
              <span className="report-card-label">{isEn ? "Balanced Games" : "משחקים מאוזנים"}</span>
              <span className="report-card-value">
                {totalBalanced} ({calcPct(totalBalanced)}%)
              </span>
            </div>
          </div>

          <div className="report-summary-card report-card-challenge">
            <span className="report-card-icon">🟣</span>
            <div className="report-card-info">
              <span className="report-card-label">{isEn ? "Challenge Games" : "משחקי אתגר"}</span>
              <span className="report-card-value">
                {totalChallenge} ({calcPct(totalChallenge)}%)
              </span>
            </div>
          </div>

          <div className="report-summary-card report-card-mentoring">
            <span className="report-card-icon">🟠</span>
            <div className="report-card-info">
              <span className="report-card-label">{isEn ? "Reinforce Games" : "משחקי חיזוק"}</span>
              <span className="report-card-value">
                {totalMentoring} ({calcPct(totalMentoring)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Players Breakdown Table */}
        <div className="session-report-table-wrapper">
          {playerStatsList.length === 0 ? (
            <p className="no-done-games-text">
              {isEn ? "No completed games yet in this session." : "עדיין אין משחקים שהסתיימו באימון זה."}
            </p>
          ) : (
            <table className="session-report-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{isEn ? "Player Name" : "שם שחקן"}</th>
                  <th>{isEn ? "Rank" : "רמה"}</th>
                  <th>{isEn ? "Total Games" : 'סה"כ משחקים'}</th>
                  <th>🟢 {isEn ? "Balanced" : "מאוזן"}</th>
                  <th>🟣 {isEn ? "Challenge" : "אתגר"}</th>
                  <th>🟠 {isEn ? "Reinforce" : "חיזוק"}</th>
                </tr>
              </thead>
              <tbody>
                {playerStatsList.map((p, idx) => (
                  <tr
                    key={p.id}
                    className="session-report-row clickable-player-row"
                    onClick={() => onPlayerClick && onPlayerClick(p.id)}
                    title={isEn ? `Click to view ${p.name}'s games` : `לחץ לצפייה במשחקים של ${p.name}`}
                  >
                    <td>{idx + 1}</td>
                    <td className="player-name-cell">{p.name}</td>
                    <td>
                      <span className={`rank-tag rank-tag-${p.rank}`}>רמה {p.rank}</span>
                    </td>
                    <td className="bold-cell">{p.total}</td>
                    <td className="stat-num balanced-num">{p.balanced}</td>
                    <td className="stat-num challenge-num">
                      {p.rank >= 4 ? <span className="stat-dash">—</span> : p.challenge}
                    </td>
                    <td className="stat-num mentoring-num">
                      {p.rank <= 2 ? <span className="stat-dash">—</span> : p.mentoring}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
