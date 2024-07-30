import { useDrop } from "react-dnd"
import openDoor from '../../assets/open-door.png'

export default function ExitSession({handleExitSession, isEn}) {
  
  const handleDrop = (playerId) => {
    handleExitSession(playerId)
  }

  // eslint-disable-next-line no-unused-vars
  const [{isOver},drop] = useDrop(()=> ({
    accept: "PLAYER-CARD",
    drop: (item) => handleDrop(item.playerId),
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    })  
  }),[handleDrop]) 

  return (
    <div className="exit-session-container" ref={drop}>
      <img src={openDoor} alt="open door"/>
      <h3>{isEn?'Players Exit':'...נתראה'}</h3>
      <img src={openDoor} alt="open door"/>
    </div>
  )
}
