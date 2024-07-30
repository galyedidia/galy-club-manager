import { useDrag } from "react-dnd"
import birdie from '../../assets/birdie.jpg'
import racket from '../../assets/racket.png'
import timelapse from '../../assets/timelapse.png'
import { useEffect, useState } from "react"
import { motion } from 'framer-motion'

export default function PlayerCard({ player,allowDrag, choacesArea = false, halfCondense=false, condense=false, gameOn=false, waitingArea=false}) {

  const [waitingTime, setWaitingTime] = useState(Math.round((((new Date()) - player.endedLastGame.toDate()) / 1000) / 60))
  
  useEffect(() => {
    const interval = setInterval(() => setWaitingTime(()=> {
      return Math.round((((new Date()) - player.endedLastGame.toDate()) / 1000) / 60)
    }), 1000);
    return () => {
      clearInterval(interval);
    };
  }, [player]);

  // eslint-disable-next-line no-unused-vars
  const [{isDragging},drag] = useDrag(() => {
    return({
      type: "PLAYER-CARD",
      item: {playerId:player.id},
      canDrag: () => allowDrag,
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging()
      })
    })
    },[allowDrag,player])

    const hasPlayerImage = () => {
      return !(player.photoURL === '' || player.photoURL === undefined || player.photoURL === null)
    }
    const hasNickName = () => {
      return !(player.nickName === '' || player.nickName === undefined || player.nickName === null)
    }
    
    const setDisplayName = () => {
      if (hasNickName()) {
        return player.nickName
      } else if (hasPlayerImage() || condense) {
        return player.firstName
      } else {
        return player.firstName + ' ' + player.familyName[0]
      }
    }

    const setDisplayImage = () => {
      if (hasPlayerImage()) {
        return player.photoURL
      } else {
        return birdie
      }
    }
    const hasBDToday = () => {
      const BD = new Date(player.dob.seconds*1000)
      const now = new Date()
      return (BD.getDate()=== now.getDate() && BD.getMonth() === now.getMonth())
    }
    const hasBDWeek = () => {
      const now = new Date()
      const BD  = (new Date(player.dob.seconds*1000)).setFullYear(now.getFullYear())
      const daysDiff = Math.abs(Math.round((now-BD)/(1000*60*60*24)))
      return(daysDiff)
    }
    let classes = "player-card"
    classes += gameOn ? " player-card-game-on" : ""
    classes += halfCondense ? " player-card-half-condense" : ""
    classes += condense ? " player-card-condense" : ""
    classes += player.isCoach && halfCondense ? " player-card-coach-half-condense" : ""
    classes += player.isCoach && condense ? " player-card-coach-condense" : ""
    classes += player.isCoach ? " player-card-coach" : ""
    classes += player.coachInCourt && choacesArea ? " player-card-coach-playing" : ""
    classes += player.isCoach && choacesArea ? " player-card-coach-area" : ""
    classes += hasBDWeek() < 8 ? " week-bd" : ""
    const cardVars = {
      hidden:  {scale:hasBDToday()?0.96:0.2},
      visible: hasBDToday() ? {
        scale: 1,
        backgroundColor: ["#bc48ea", "#c0a0fd", "#f8a1a1"],
        transition: { delay: 1, duration: 2, repeat: Infinity, repeatType: "reverse" }
      } : {scale:1}
    } 
    return (

      <motion.div layout className={classes} ref={drag} 
        whileHover={gameOn ? {scale:1}       : {scale:0.95}   }
        whileTap=  {gameOn ? {rotate:"0deg"} : {rotate:"4deg"}}
        variants={cardVars} initial="hidden" animate="visible"
        //transition={{duration:0.2}}
        draggable={true}
      >
        <motion.img src={setDisplayImage()} alt="player"
                initial={{rotate: "60deg"}}
                animate={{rotate: "0deg"}}
                //transition={{duration:0.2}}
        
        />
        {!player.isCoach && <p>{setDisplayName()}</p>}
        {waitingArea && <div className="player-card-header">
          <div>
             <p>{player.gamesInSession}</p>
             <img src={racket} alt="racket"/>
          </div>
          <div>
            <p>{waitingTime}</p>
            <img src={timelapse} alt="timelaps"/>
          </div>
        </div>}
      </motion.div>

  )
}
