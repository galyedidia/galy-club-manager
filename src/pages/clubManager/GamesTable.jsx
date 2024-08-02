
import { motion } from 'framer-motion'

export default function GamesTable({lastGameStat,allClubPlayersDocs,isEn,doneGames,specificPlayerId=null}) {
  const rowVar = {
    hidden: {opacity:0, scale:0.5},
    visible: {opacity:1, scale:1},
  }
  const specificPlayer = specificPlayerId ? allClubPlayersDocs.find((cp)=> cp.id===specificPlayerId) : null  

  const getGameTime = (firebaseDate) => {
    //console.log('getGameTime',firebaseDate)
    if (firebaseDate) {
      const date = new Date(firebaseDate.seconds*1000)
      const hours = date.getHours()
      const minutes = date.getMinutes() < 10 ? ('0' + date.getMinutes()) : date.getMinutes()
       
      return `${hours}:${minutes}`
    } else {
      return ''
    }
  }
  const getTeam = (team) => {
    let players = ''       
    team.forEach((playerId,index) => {
      const _player = allClubPlayersDocs.find((cp)=> cp.id===playerId)
      players += index > 0 ? '  -  ':''
      if (playerId === specificPlayerId) {
        players += `<span class="highlight-specific-player">${_player.firstName} ${_player.familyName[0]}</span>`
      } else {
        players += `${_player.firstName} ${_player.familyName[0]}`
      }
    });
    return players
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
        {specificPlayer && <h3 className='specific-player-header'>{isEn?`The game of ${specificPlayer.firstName} ${specificPlayer.familyName[0]}`:
                                                                  `המשחקים של ${specificPlayer.firstName} ${specificPlayer.familyName[0]}`}</h3>}
        <div className="club-manager-table-wrapper">
            {allClubPlayersDocs &&
            <table>         
                <motion.tr variants={rowVar} initial='hidden' animate='visible' transition={{type: 'spring',delay:0.1}} className='club-manager-table-header'>
                    <th>{isEn?'Court':'מגרש'}</th> 
                    <th>{isEn?'Start Time':'זמן התחלה'}</th> 
                    {!specificPlayer && <th>{isEn?'End Time':'זמן סיום'}</th>}            
                    <th>{isEn?'Winning Team':'קבוצה מנצחת'}</th>            
                    <th>{isEn?'Loosing Team':'קבוצה מפסידה'}</th>            
                </motion.tr>
                {doneGames.map((game,i) => (
                    <motion.tr variants={rowVar} initial='hidden' animate='visible' transition={{type: 'spring',delay: 0.1+i*0.03}} key={game.startTime.seconds} className="club-manager-table-rows">
                        <td>{game.courtNumber+1}</td>
                        <td>{getGameTime(game.startTime)}</td>
                        {!specificPlayer && <td>{getGameTime(game.endTime)}</td>}
                        <td dangerouslySetInnerHTML={{__html: getTeam(game.winTeam)}}  className='done-games-team'></td>
                        <td dangerouslySetInnerHTML={{__html: getTeam(game.loseTeam)}} className='done-games-team'></td>
                    </motion.tr>
                )
                )}
            </table>}
        </div>
    </div>
  )
}
