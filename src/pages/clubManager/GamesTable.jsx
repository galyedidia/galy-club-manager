
import { motion } from 'framer-motion'
import { getPlayerRank } from '../../utils/matchmaking'

export default function GamesTable({lastGameStat,allClubPlayersDocs,isEn,doneGames,specificPlayerId=null}) {
  const rowVar = {
    hidden: {opacity:0, scale:0.5},
    visible: {opacity:1, scale:1},
  }
  const specificPlayer = specificPlayerId ? allClubPlayersDocs.find((cp)=> cp.id===specificPlayerId) : null  

  const getGameTime = (firebaseDate) => {
    if (firebaseDate) {
      const date = new Date(firebaseDate.seconds*1000)
      const hours = date.getHours()
      const minutes = date.getMinutes() < 10 ? ('0' + date.getMinutes()) : date.getMinutes()
       
      return `${hours}:${minutes}`
    } else {
      return ''
    }
  }

  const getGameType = (game) => {
    if (!specificPlayerId || !allClubPlayersDocs) return null
    const team = (game.winTeam && game.winTeam.includes(specificPlayerId)) 
      ? game.winTeam 
      : (game.loseTeam && game.loseTeam.includes(specificPlayerId)) 
        ? game.loseTeam 
        : null
    if (!team) return null
    const partnerId = team.find(id => id !== specificPlayerId)
    if (!partnerId) return { type: 'BALANCED', label: isEn ? 'Balanced' : 'מאוזן', color: '#4ade80', dot: '🟢' }

    const myRank = getPlayerRank(specificPlayerId, allClubPlayersDocs)
    const partnerRank = getPlayerRank(partnerId, allClubPlayersDocs)
    const diff = partnerRank - myRank

    if (diff >= 2) {
      return { type: 'CHALLENGE', label: isEn ? 'Challenge' : 'אתגר', color: '#c084fc', dot: '🟣', diff, partnerRank }
    } else if (diff <= -2) {
      return { type: 'MENTORING', label: isEn ? 'Reinforce' : 'חיזוק', color: '#fb923c', dot: '🟠', diff, partnerRank }
    } else {
      return { type: 'BALANCED', label: isEn ? 'Balanced' : 'מאוזן', color: '#4ade80', dot: '🟢', diff, partnerRank }
    }
  }

  const getTeam = (team) => {
    let players = ''       
    team.forEach((playerId,index) => {
      const _player = allClubPlayersDocs.find((cp)=> cp.id===playerId)
      const pName = _player ? `${_player.firstName} ${_player.familyName ? _player.familyName[0] : ''}` : 'Unknown'
      players += index > 0 ? '  -  ':''
      if (playerId === specificPlayerId) {
        players += `<span class="highlight-specific-player">${pName}</span>`
      } else {
        players += `${pName}`
      }
    });
    return players
  }

  // Summary counts for specific player
  const stats = { balanced: 0, challenge: 0, mentoring: 0 }
  if (specificPlayerId && doneGames) {
    doneGames.forEach((game) => {
      const gType = getGameType(game)
      if (gType) {
        if (gType.type === 'CHALLENGE') stats.challenge++
        else if (gType.type === 'MENTORING') stats.mentoring++
        else stats.balanced++
      }
    })
  }

  if (specificPlayer && doneGames.length === 0) {
    return (
        <div className='no-done-games-container'>
            <h2>{isEn?`No games to display yet for ${specificPlayer.firstName} ${specificPlayer.familyName[0]}`:`ל${specificPlayer.firstName} ${specificPlayer.familyName[0]} עדיין אין משחקים להצגה`}</h2>
        </div>
    )
  }
  return (
    <div className="club-manager-table-container" style={specificPlayerId?{height:'auto'}:lastGameStat?{height:'65vh'}:{height:'80vh'}}>
        {specificPlayer && (
          <div className='specific-player-header-container'>
            <h3 className='specific-player-header'>
              {isEn?`The games of ${specificPlayer.firstName} ${specificPlayer.familyName[0]}`: `המשחקים של ${specificPlayer.firstName} ${specificPlayer.familyName[0]}`}
            </h3>
            <div className='game-stats-summary-bar'>
              <span className='stat-pill stat-balanced'>🟢 {stats.balanced} {isEn ? 'Balanced' : 'מאוזנים'}</span>
              <span className='stat-pill stat-challenge'>🟣 {stats.challenge} {isEn ? 'Challenge' : 'אתגר'}</span>
              <span className='stat-pill stat-mentoring'>🟠 {stats.mentoring} {isEn ? 'Reinforce' : 'חיזוק'}</span>
            </div>
          </div>
        )}
        <div className="club-manager-table-wrapper">
            {allClubPlayersDocs &&
            <table>         
                <motion.tr variants={rowVar} initial='hidden' animate='visible' transition={{type: 'spring',delay:0.1}} className='club-manager-table-header'>
                    <th>{isEn?'Court':'מגרש'}</th> 
                    <th>{isEn?'Start Time':'זמן התחלה'}</th> 
                    {!specificPlayer && <th>{isEn?'End Time':'זמן סיום'}</th>}
                    {specificPlayer && <th>{isEn?'Type':'סוג'}</th>}
                    <th>{isEn?'Winning Team':'קבוצה מנצחת'}</th>            
                    <th>{isEn?'Loosing Team':'קבוצה מפסידה'}</th>            
                </motion.tr>
                {doneGames.map((game,i) => {
                    const gType = specificPlayer ? getGameType(game) : null
                    return (
                      <motion.tr variants={rowVar} initial='hidden' animate='visible' transition={{type: 'spring',delay: 0.1+i*0.03}} key={game.startTime ? game.startTime.seconds : i} className="club-manager-table-rows">
                          <td>{game.courtNumber+1}</td>
                          <td>{getGameTime(game.startTime)}</td>
                          {!specificPlayer && <td>{getGameTime(game.endTime)}</td>}
                          {specificPlayer && (
                            <td>
                              {gType && (
                                <span className={`game-type-badge game-type-${gType.type.toLowerCase()}`}>
                                  {gType.dot} {gType.label}
                                </span>
                              )}
                            </td>
                          )}
                          <td dangerouslySetInnerHTML={{__html: getTeam(game.winTeam)}}  className='done-games-team'></td>
                          <td dangerouslySetInnerHTML={{__html: getTeam(game.loseTeam)}} className='done-games-team'></td>
                      </motion.tr>
                    )
                })}
            </table>}
        </div>
    </div>
  )
}
