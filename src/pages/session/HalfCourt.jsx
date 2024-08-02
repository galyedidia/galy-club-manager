import { useDrop } from "react-dnd"
import PlayerCard from "./PlayerCard"
import { motion } from 'framer-motion'

export default function HalfCourt({court, allClubPlayersDocs, aTeamSide, addPlayerToCourt, endGame, 
                                   isEn, viewer, numberWaitingCourts, handlePlayerClick}) {
  const vars = {
    hidden: {opacity:0, scale:0, transition:{duration:0.7}},
    visible: {opacity:1, scale:1, transition:{duration:0.7}}
  }

  const team = aTeamSide ? court.aTeam : court.bTeam

  const handleDrop = (playerId) => {
    if (!court.gameOn && team.length < 3) {
      addPlayerToCourt(playerId,court,aTeamSide)
    }
  }

  // eslint-disable-next-line no-unused-vars
  const [{isOver},drop] = useDrop(()=> ({
    accept: "PLAYER-CARD",
    drop: (item) => handleDrop(item.playerId),
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    })  
  }),[court,team, handleDrop]) 

  //style={{backgroundColor:!court.gameOn ? 'white':'pink'}}
  const classes = aTeamSide ? "half-court" : "half-court down-court"
  return (
    <div className={classes} ref={drop} >

        {court.gameOn && !aTeamSide && !viewer && <motion.button 
          variants={vars} initial="hidden" animate="visible" 
          className="court-btn court-btn-b-win" onClick={()=>endGame('bWin')}>{isEn?'Win':'נצחון'}</motion.button>}

      <ul className="half-court-player-list">
        {team.map((playerId) => {
          const player = allClubPlayersDocs.find((cp)=> cp.id===playerId)
          return (
            <PlayerCard player={player} key={playerId} allowDrag={!court.gameOn && !viewer} 
                       halfCondense={numberWaitingCourts>1 && team.length>1} condense={team.length>2} gameOn={court.gameOn} handlePlayerClick={handlePlayerClick}/>
          )
          })}
      </ul>

        {court.gameOn && aTeamSide && !viewer && <motion.button 
          variants={vars} initial="hidden" animate="visible" 
          className="court-btn court-btn-a-win" onClick={()=>endGame('aWin')}>{isEn?'Win':'נצחון'}</motion.button>}

    </div>
  )
}
