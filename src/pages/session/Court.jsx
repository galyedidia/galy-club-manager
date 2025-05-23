import HalfCourt from "./HalfCourt"
import { useDrag, useDrop } from "react-dnd"
import grayCourt from '../../assets/grayCourt-noBorderBetterNet.png'
import speakerImg from '../../assets/speaker.png'
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from 'framer-motion'

export default function Court({court, allClubPlayersDocs,startGame,endGame,
                               addPlayerToCourt,addWaitingCourtPlayersToCourt,
                               time,isEn, viewer,addWaitingCourt, removeWaitingCourt, numWaitingCourts, handlePlayerClick}) {
  const vars = {
    hidden: {opacity:0, scale:0, transition:{duration:0.7}},
    visible: {opacity:1, scale:1, transition:{duration:0.7}},
    exit: {opacity:[1,1,0], scale: [1,1.4,0], time:[0,0.75,1]}
  }
  const [playingTime, setPlayingTime] = useState('0:00')
  
  useEffect(() => {

      if (court.gameOn) {
        setPlayingTime(()=> {
          const total = Math.round((((new Date()) - court.startTime.toDate()) / 1000))
          const minutes = Math.floor(total / 60)
          const seconds = total%60 < 10 ? ('0'+total%60):total%60
          return `${minutes}:${seconds}`
        })
      }
    
  }, [court,time]);
  
  // eslint-disable-next-line no-unused-vars
  const [{isDragging},drag] = useDrag(() => {
    return({
      type: "WAITING-COURT",
      item: {waitingCourtId: court.id},
      canDrag: () => court.waitingCourt && court.aTeam.length>0 && court.bTeam.length>0 && !viewer,
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging()
      })
    })
  },[court])

  const handleWaitingCourtDrop = (waitingCourtId) => {
    if (court.aTeam.length===0 && court.bTeam.length===0) {
      addWaitingCourtPlayersToCourt(court, waitingCourtId)
    }
  }

  // eslint-disable-next-line no-unused-vars
  const [{isOver},drop] = useDrop(()=> ({
    accept: "WAITING-COURT",
    drop: (item) => handleWaitingCourtDrop(item.waitingCourtId),
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    })  
  }),[handleWaitingCourtDrop]) 
  const getTeam = (team) => {
    let players = ''       
    team.forEach((playerId,index) => {
      const _player = allClubPlayersDocs.find((cp)=> cp.id===playerId)
      players += index > 0 ? ' , ':''
      players += `${_player.firstName}`
    });
    return players
  }

  async function speak(textSegments) {
    for (const segment of textSegments) {
      await new Promise((resolve, reject) => {
        const utterance = new SpeechSynthesisUtterance(segment.text);
        utterance.lang = 'he-IL';
        utterance.volume = 1;
        utterance.rate = segment.rate || 1; // Default rate is 1 if not specified
  
        utterance.onend = resolve;
        utterance.onerror = reject;
  
        speechSynthesis.speak(utterance);
      });
    }
  }
  const announce = async () => {
    const bell = new Audio('/bell1.wav');
    // Get the teams names
    const aTeam = getTeam(court.aTeam)
    const bTeam = getTeam(court.bTeam)
    
    const textSegments = [
      {text: `${aTeam} , ${bTeam} לֶמִגְרָשׁ ${court.id+1}` , rate: 1},
      // {text: ` יעלו ויבואו, לֶמִגְרָשׁ מספר ${court.id+1}, ${aTeam} ,נגד ,${bTeam}`, rate: 1},
      // {text: aTeam  , rate: 0.7},
      // {text: ` נגד `, rate: 1.0},
      // {text: bTeam  , rate: 0.7}
      // {text: 'יאללה!', rate:1}
    ]
    await bell.play();
    setTimeout(()=>speak(textSegments),2500)
    // speak(textSegments);
  }
  const canStartGame = () => {
    return (court.aTeam.length > 0  && court.bTeam.length > 0 && !court.gameOn)
  }
  const add = ">"
  const remove = "<"
  const classes = court.gameOn ? "court court-game-on" : "court"
  const showRemoveWaiting = !viewer && court.waitingIndex === 1 && court.aTeam.length===0 && court.bTeam.length===0
  const showAddWaiting = !viewer && court.waitingIndex === 0 && numWaitingCourts < 2
  return (
    <div className={classes} key={court.id} ref={court.waitingCourt ? drag : drop} 
    style={{backgroundImage:`url(${grayCourt})`}}>
      <HalfCourt key={`${court.id}-aTeam`} court={court} allClubPlayersDocs={allClubPlayersDocs} aTeamSide={true} 
                  endGame={endGame} addPlayerToCourt={addPlayerToCourt} isEn={isEn} viewer={viewer} numberWaitingCourts={numWaitingCourts} 
                  handlePlayerClick={handlePlayerClick}/>
      {<span className="court-button-container">
        {court.waitingCourt && <p className="next-game-middle-court">
          {showRemoveWaiting && <motion.button 
          variants={vars} initial="hidden" animate="visible" 
          className="court-btn remove-waiting" onClick={removeWaitingCourt}>{remove}</motion.button>}
          {isEn?(court.waitingIndex===0?'Next Game':'Next Next G'):(court.waitingIndex===0?'המשחק הבא':'המשחק הבא הבא')}
          {showAddWaiting && <motion.button 
          variants={vars} initial="hidden" animate="visible" 
          className="court-btn add-waiting" onClick={addWaitingCourt}>{add}</motion.button>}
          </p>}
        <AnimatePresence>
          {!court.waitingCourt && !court.gameOn  && <motion.p layout
            variants={vars} initial="hidden" animate="visible" exit="exit"
            className="court-number">{court.id+1}</motion.p>}
          {!court.waitingCourt && !court.gameOn && canStartGame() && !viewer && <motion.button 
            variants={vars} initial="hidden" animate="visible" exit="exit"
            className="court-btn speaker" onClick={announce}>
              <img src={speakerImg} alt="speaker"/></motion.button>}
          {!court.waitingCourt && !court.gameOn && canStartGame() && !viewer && <motion.button 
            variants={vars} initial="hidden" animate="visible" exit="exit"
            className="court-btn" onClick={startGame}>{isEn?'Smash':'! סמאש'}</motion.button>}
          {court.gameOn  && <motion.p  
            variants={vars} initial="hidden" animate="visible" exit="exit"
            className="court-play-time">{playingTime}</motion.p>}
        </AnimatePresence>
      </span>}
      <HalfCourt key={`${court.id}-bTeam`} court={court} allClubPlayersDocs={allClubPlayersDocs} aTeamSide={false} 
                 endGame={endGame} addPlayerToCourt={addPlayerToCourt} isEn={isEn} viewer={viewer} numberWaitingCourts={numWaitingCourts} 
                 handlePlayerClick={handlePlayerClick}/>
    </div>
  )
}
