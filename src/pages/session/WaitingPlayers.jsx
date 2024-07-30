import { useDrop } from "react-dnd"
import PlayerCard from "./PlayerCard"


export default function WaitingPlayers( {waitingPlayers, handleDropBackToWaiting, isEn, viewer}) {
  
  // eslint-disable-next-line no-unused-vars
  const [{isOver},drop] = useDrop(()=> ({
    accept: "PLAYER-CARD",
    drop: (item) => handleDropBackToWaiting(item.playerId),
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    })  
  }),[handleDropBackToWaiting]) 

  const sortedWaitingPlayers = waitingPlayers.sort((a,b)=> {
    if (a.endedLastGame > b.endedLastGame) {
      return 1
    } else if (a.endedLastGame < b.endedLastGame) {
      return -1
    } else if (a.gamesInSession > b.gamesInSession) {
      return 1
    } else if (a.gamesInSession < b.gamesInSession){
      return -1
    } else {
      return 0
    }
  })
  return (
    <div className="waiting-players-container-new" ref={drop}>
      {sortedWaitingPlayers.length === 0 && <div className="no-waiting-players">{isEn?'No Waiting Players ...':'...אין שחקנים ממתינים'}</div>}
      {sortedWaitingPlayers.length >   0 && sortedWaitingPlayers.map((player)=> {
        return (
          <PlayerCard player={player} key={player.id} allowDrag={!viewer} waitingArea={true}/>
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
