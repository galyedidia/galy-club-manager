import { useDrop } from "react-dnd"
import PlayerCard from "./PlayerCard"


export default function WaitingPlayers( {waitingPlayers, handleDropBackToWaiting, isEn, viewer, handlePlayerClick, time}) {
  
  // eslint-disable-next-line no-unused-vars
  const [{isOver},drop] = useDrop(()=> ({
    accept: "PLAYER-CARD",
    drop: (item) => handleDropBackToWaiting(item.playerId),
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    })  
  }),[handleDropBackToWaiting]) 

  const getSeconds = (firebaseDate) => {
    if (!firebaseDate) return 0
    if (firebaseDate.seconds !== undefined) return firebaseDate.seconds
    if (firebaseDate.toDate) return Math.floor(firebaseDate.toDate().getTime() / 1000)
    if (firebaseDate instanceof Date) return Math.floor(firebaseDate.getTime() / 1000)
    return 0
  }

  const sortedWaitingPlayers = [...waitingPlayers].sort((a,b)=> {
    const aGames = a.gamesInSession || 0
    const bGames = b.gamesInSession || 0

    // 1. Primary: Players with fewer games in session get priority
    if (aGames < bGames) {
      return -1
    }
    if (aGames > bGames) {
      return 1
    }

    // 2. Secondary: Players who finished earlier (waited longer) get priority
    const aTime = getSeconds(a.endedLastGame)
    const bTime = getSeconds(b.endedLastGame)
    if (aTime < bTime) {
      return -1
    }
    if (aTime > bTime) {
      return 1
    }

    return 0
  })
  return (
    <div className="waiting-players-container-new" ref={drop}>
      {sortedWaitingPlayers.length === 0 && <div className="no-waiting-players">{isEn?'No Waiting Players ...':'...אין שחקנים ממתינים'}</div>}
      {sortedWaitingPlayers.length >   0 && sortedWaitingPlayers.map((player)=> {
        return (
          <PlayerCard player={player} key={player.id} allowDrag={!viewer} waitingArea={true} handlePlayerClick={handlePlayerClick} time={time}/>
        )
      })}
    </div>
  )
  // return (
  //   <div className="waiting-players-container" ref={drop}>
  //     <div className="waiting-players-wrapper">
  //       <ul className="waiting-players-list" >
  //         {sortedWaitingPlayers.length === 0 && <div className="no-waiting-players">{isEn?'No Waiting Players ...':'...אין שחקנים ממתינים'}</div>}
  //         {sortedWaitingPlayers.length >   0 && sortedWaitingPlayers.map((player)=> {
  //           return (
  //             <PlayerCard 
  //               player={player} 
  //               key={player.id} 
  //               allowDrag={!viewer} 
  //               waitingArea={true}
  //             />
  //           )
  //         })}
  //       </ul>
  //     </div>
  //   </div>
  // )
}
