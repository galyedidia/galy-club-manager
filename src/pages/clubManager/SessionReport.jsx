import { useAuthContext } from "../../hooks/useAuthContext";
import { useCollection } from "../../hooks/useCollection";
import ScoreBoard from "../session/ScoreBoard";
import { calculateScoreBoard } from "../session/ScoreBoardUtil";
import StatDisplay from "./StatDisplay";
import { motion } from 'framer-motion'

export default function SessionReport( { session, isEn, lastGameStat=false } ) {
  const rowVar = {
    hidden: {opacity:0, scale:0.5},
    visible: {opacity:1, scale:1},
  }  
  // Get User
  const { user } = useAuthContext()

  // Get Players 
  const { documents:allClubPlayersDocs  } = useCollection (
    'players',
    ["clubId","==",user.clubId],
    null,
    null//["firstName","desc"]
  )

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
  const formatDate = (firebaseDate) => {
    if (firebaseDate) {
      const date = new Date(firebaseDate.seconds*1000)
      return `${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}`
    } else {
      return ''
    }
  }
  const getWinTeam = (game) => {
    let winPlayers = ''
    game.winTeam.forEach((playerId,index) => {
      const player = allClubPlayersDocs.find((cp)=> cp.id===playerId)
      winPlayers += index > 0 ? ' - ':''
      winPlayers += ` ${player.firstName} ${player.familyName[0]}`
    });
    return winPlayers
  }
  const getLoseTeam = (game) => {
    let losePlayers = ''       
    game.loseTeam.forEach((playerId,index) => {
      const player = allClubPlayersDocs.find((cp)=> cp.id===playerId)
      losePlayers += index > 0 ? ' - ':''
      losePlayers += `${player.firstName} ${player.familyName[0]}`
    });
    return losePlayers
  }
  const getNumberOfPlayers = () => {
    const _allGames  = session.doneGames.flatMap((game)=>[...game.winTeam,...game.loseTeam])
    const _allPlayers = []
    _allGames.forEach((playerId)=>{
      if (!_allPlayers.includes(playerId)) {
        _allPlayers.push(playerId)
      }
    })
    return _allPlayers.length
  }
  const getAvgGameTime = () => {
    let _sumGameTime = 0
    session.doneGames.forEach((game) => {
      const gameTime = game.endTime.seconds - game.startTime.seconds
      _sumGameTime += gameTime
    })
    return ((_sumGameTime / session.doneGames.length)/60).toFixed(0)
  }
  const getSeconds = (firebaseDate) => {
    return firebaseDate ? firebaseDate.seconds : ''
  }
  const getAvgWaitTime = () => {
    // Get All Players
    const _allGames  = session.doneGames.flatMap((game)=>[...game.winTeam,...game.loseTeam])
    const _allPlayers = []
    _allGames.forEach((playerId)=>{
      if (!_allPlayers.includes(playerId)) {
        _allPlayers.push(playerId)
      }
    })
    // For each player - get all of it games sorted by start time.
    // Then sum up the waiting time
    let totalWait = 0
    let totalwaiters = 0
    _allPlayers.forEach((playerId) => {
      const allPlayerGames = session.doneGames.filter((game) => game.winTeam.includes(playerId) || game.loseTeam.includes(playerId))
                          .sort((a,b) => {return (getSeconds(a.startTime) > getSeconds(b.startTime)) ? 1 : -1})
      totalwaiters += allPlayerGames.length
      // console.log('getAvgWaitTime',playerId,allPlayerGames)
      allPlayerGames.forEach((game,index) => {
        if (index > 0) {
          const waitTime= game.startTime.seconds - allPlayerGames[index-1].endTime.seconds
          totalWait += waitTime
          // console.log(waitTime,totalWait)
        }
      })
    })
    // console.log(totalWait,totalwaiters)
    return ((totalWait / totalwaiters)/60).toFixed(0) 
  }
  
  return (
    <div className="session-report">
      <p className="session-report-date">{formatDate(session.createdAt)}</p>
      <div className="stat-display-col">
        <StatDisplay number={session.doneGames.length} text={isEn?'# Games':'# משחקים'}/>
        <StatDisplay number={getNumberOfPlayers()} text={isEn?'# Players':'# שחקנים'}/>
        <StatDisplay number={getAvgGameTime()} text={isEn?'Avg Play Time':'זמן משחק ממוצע'}/>
        <StatDisplay number={getAvgWaitTime()} text={isEn?'Avg. Wait Time':'זמן המתנה ממוצע'}/>
      </div>
      <div className="club-manager-table-container" style={lastGameStat?{height:'65vh'}:{height:'80vh'}}>
        <div className="club-manager-table-wrapper">
        {allClubPlayersDocs &&
          <table>         
            <motion.tr variants={rowVar} initial='hidden' animate='visible' transition={{type: 'spring',delay:0.1}} className='club-manager-table-header'>
              <th>{isEn?'Court':'מגרש'}</th> 
              <th>{isEn?'Start Time':'זמן התחלה'}</th> 
              <th>{isEn?'End Time':'זמן סיום'}</th>            
              <th>{isEn?'Winning Team':'קבוצה מנצחת'}</th>            
              <th>{isEn?'Loosing Team':'קבוצה מפסידה'}</th>            
            </motion.tr>
            {session.doneGames.map((game,i) => (
                <motion.tr variants={rowVar} initial='hidden' animate='visible' transition={{type: 'spring',delay: 0.1+i*0.03}} key={game.startTime.seconds} className="club-manager-table-rows">
                  <td>{game.courtNumber+1}</td>
                  <td>{getGameTime(game.startTime)}</td>
                  <td>{getGameTime(game.endTime)}</td>
                  <td>{getWinTeam(game)}</td>
                  <td>{getLoseTeam(game)}</td>
                </motion.tr>
              )
            )}
          </table>}
        </div>
      </div>
      <div className="stat-display-scoreboard">
        <ScoreBoard allClubPlayersDocs={allClubPlayersDocs} scoreBoard={calculateScoreBoard(session)} maxShow={50} inReport={true}/>
      </div>
    </div>
  )
}
