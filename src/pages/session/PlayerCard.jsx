import { useDrag } from "react-dnd"
import birdie from '../../assets/birdie.jpg'
import racket from '../../assets/racket.png'
import timelapse from '../../assets/timelapse.png'
import { motion } from 'framer-motion'

export default function PlayerCard({ player, allowDrag, choacesArea = false, halfCondense=false, condense=false, gameOn=false, waitingArea=false, handlePlayerClick, time, matchBadge=null }) {

  const getWaitingTime = () => {
    if (!player || !player.endedLastGame) return 0
    const lastDate = player.endedLastGame.toDate ? player.endedLastGame.toDate() : new Date(player.endedLastGame)
    return Math.max(0, Math.round(((new Date() - lastDate) / 1000) / 60))
  }
  const waitingTime = getWaitingTime()

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
        const familyInitial = (player.familyName && player.familyName.length > 0) ? player.familyName[0] : ''
        return familyInitial ? `${player.firstName} ${familyInitial}` : (player.firstName || '')
      }
    }

    const setDisplayImage = () => {
      if (hasPlayerImage()) {
        return player.photoURL
      } else {
        return birdie
      }
    }

    const getDobSeconds = () => {
      if (!player || !player.dob) return null
      if (player.dob.seconds !== undefined) return player.dob.seconds
      if (player.dob.toDate) return player.dob.toDate().getTime() / 1000
      if (player.dob instanceof Date) return player.dob.getTime() / 1000
      return null
    }

    const hasBDToday = () => {
      const seconds = getDobSeconds()
      if (!seconds) return false
      const BD = new Date(seconds * 1000)
      const now = new Date()
      return (BD.getDate() === now.getDate() && BD.getMonth() === now.getMonth())
    }
    const hasBDWeek = () => {
      const seconds = getDobSeconds()
      if (!seconds) return 999
      const now = new Date()
      const BD = (new Date(seconds * 1000)).setFullYear(now.getFullYear())
      const daysDiff = Math.abs(Math.round((now - BD) / (1000 * 60 * 60 * 24)))
      return daysDiff
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
    //console.log("Card ",player.firstName, " classes ",classes)
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
        whileHover={gameOn ? {scale:1} : {scale:0.95}}
        variants={cardVars} initial="hidden" animate="visible"
      >
        {matchBadge && (
          <div className="player-court-badge" title={matchBadge.label}>
            <span className="player-court-badge-dot" style={{ backgroundColor: matchBadge.color }}></span>
          </div>
        )}
        <motion.img src={setDisplayImage()} alt="player"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                initial={{rotate: "60deg"}}
                animate={{rotate: "0deg"}}
                onClick={()=>handlePlayerClick(player.id)}
        />
        {!player.isCoach && <p>{setDisplayName()}</p>}
        {waitingArea && <div className="player-card-header">
          <div>
             <p>{player.gamesInSession}</p>
             <img src={racket} alt="racket" draggable={false} onDragStart={(e) => e.preventDefault()}/>
          </div>
          <div>
            <p>{waitingTime}</p>
            <img src={timelapse} alt="timelaps" draggable={false} onDragStart={(e) => e.preventDefault()}/>
          </div>
        </div>}
      </motion.div>

  )
}
