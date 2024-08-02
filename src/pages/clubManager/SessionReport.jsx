import { useState } from "react";
import { useAuthContext } from "../../hooks/useAuthContext";
import { useCollection } from "../../hooks/useCollection";
import ScoreBoard from "../session/ScoreBoard";
import { calculateScoreBoard } from "../session/ScoreBoardUtil";
import GamesTable from "./GamesTable";
import StatDisplay from "./StatDisplay";
import DoneGamesModal from "../session/DoneGamesModal";

export default function SessionReport( { session, isEn, lastGameStat=false } ) {
  const [showDoneGamesModal, setShowDoneGamesModal] = useState(null)

  // Get User
  const { user } = useAuthContext()

  // Get Players 
  const { documents:allClubPlayersDocs  } = useCollection (
    'players',
    ["clubId","==",user.clubId],
    null,
    null//["firstName","desc"]
  )

  const formatDate = (firebaseDate) => {
    if (firebaseDate) {
      const date = new Date(firebaseDate.seconds*1000)
      return `${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}`
    } else {
      return ''
    }
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
  const handlePlayerClick = (playerId) => {
    setShowDoneGamesModal(playerId)
  }

  return (
    <div className="session-report">
       {showDoneGamesModal && <DoneGamesModal allClubPlayersDocs={allClubPlayersDocs} done={()=>setShowDoneGamesModal(null)} isEn={isEn} 
                                                   playerId={showDoneGamesModal} session={session}/>}
      <p className="session-report-date">{formatDate(session.createdAt)}</p>
      <div className="stat-display-col">
        <StatDisplay number={session.doneGames.length} text={isEn?'# Games':'# משחקים'}/>
        <StatDisplay number={getNumberOfPlayers()} text={isEn?'# Players':'# שחקנים'}/>
        <StatDisplay number={getAvgGameTime()} text={isEn?'Avg Play Time':'זמן משחק ממוצע'}/>
        <StatDisplay number={getAvgWaitTime()} text={isEn?'Avg. Wait Time':'זמן המתנה ממוצע'}/>
      </div>
      <GamesTable allClubPlayersDocs={allClubPlayersDocs} doneGames={session.doneGames} isEn={isEn} lastGameStat={lastGameStat} />
      <div className="stat-display-scoreboard">
        <ScoreBoard allClubPlayersDocs={allClubPlayersDocs} scoreBoard={calculateScoreBoard(session,1)} maxShow={50} inReport={true} handlePlayerClick={handlePlayerClick} isEn={isEn}/>
      </div>
    </div>
  )
}
