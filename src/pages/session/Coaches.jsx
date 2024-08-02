import PlayerCard from "./PlayerCard";
import { useDrop } from "react-dnd"

export default function Coaches( { coachesAtSession, handleDropBackToWaiting , isEn, viewer, handlePlayerClick }) {

  // eslint-disable-next-line no-unused-vars
  const [{isOver},drop] = useDrop(()=> ({
      accept: "PLAYER-CARD",
    drop: (item) => handleDropBackToWaiting(item.playerId),
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    })  
  }),[handleDropBackToWaiting]) 

  return (
    <div className="coaches-container" ref={drop}>
      <div className="coaches-list">
        {coachesAtSession && coachesAtSession.length === 0 &&<div className="no-coaches">{isEn?'No Coaches yet...':'...אין מאמנים עדיין'}</div>}
        {coachesAtSession && coachesAtSession.length > 0 && coachesAtSession.map((c)=>
          <PlayerCard player={c} key={c.id} allowDrag={!c.coachInCourt && !viewer} choacesArea={true} handlePlayerClick={handlePlayerClick}/>
        )}
      </div>
    </div>
  )
}
