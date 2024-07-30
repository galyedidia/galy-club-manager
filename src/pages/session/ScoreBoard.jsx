import React from 'react'
import { motion } from 'framer-motion'
import birdie from '../../assets/birdie.jpg'

export default function ScoreBoard( {scoreBoard, allClubPlayersDocs, maxShow, clickOnScoreboard, inModal=false, inReport=false ,isEn=true} ) {
  
  const scoreVar = {
    hidden: {opacity:0, scale:0.75},
    visible: {opacity:1, scale:1},
  }

  const hasNickName = (player) => {return !(player.nickName === '' || player.nickName === undefined || player.nickName === null)}

  const showName = (player) => {
    if (hasNickName(player)) {
      if (inModal) {
        return `${player.firstName} ${player.familyName} (${player.nickName})`
      } else {
        return player.nickName
      }
    } else {
      if (inModal) {
        return `${player.firstName} ${player.familyName}`
      } else {
        return player.firstName
      }
    }
  }
  const hasPlayerImage = (player) => {
    return !(player.photoURL === '' || player.photoURL === undefined || player.photoURL === null)
  }
  const setDisplayImage = (player) => {
    if (hasPlayerImage(player)) {
      return player.photoURL
    } else {
      return birdie
    }
  }

  let classes = 'scoreboard-container'
  classes += inModal ? ' scoreboard-modal-container' : ''
  const rowClass = inModal ? 'scoreboard-rows-modal' : 'scoreboard-rows'
  return (
    <div className={classes} style={{direction:isEn?'ltr':'rtl'}}>
      {scoreBoard&&scoreBoard.length === 0  && <div ><p className='no-scores-yet'>{isEn?'No Scores yet...':'...אין תוצאות עדיין'}</p></div>}
      <motion.table whileHover={inReport ? {scale:1}: {scale:1.03}} className="scoreboard-list" onClick={clickOnScoreboard} >        
        {scoreBoard && scoreBoard.length > 0 && <tr className='scoreboard-header'>
          {inModal && <th style={{width:'5vw'}}> </th>}
          <th style={inModal?{width:'6vw'}:{width:'1.5vw'}}>{inModal?isEn?'Rank':'דירוג':isEn?'R':'דירוג'}</th>
          <th style={inModal?{width:'6vw'}:{width:'1.5vw'}}>{inModal?isEn?'Score':'ניקוד':isEn?'S':'ניקוד'}</th>
          <th style={inModal?{width:'17vw'}:{width:'5vw'}}>{isEn?'Name':'שם'}</th>
          <th style={inModal?{width:'12vw'}:{width:'3vw'}}>{inModal?isEn?'Wins/Games':'נצחונות/משחקים':isEn?'W/G':'נ/מ'}</th>              
        </tr>}
        {scoreBoard && scoreBoard.length > 0 && allClubPlayersDocs && scoreBoard.slice(0,maxShow).map((score,i) => {
          const player = allClubPlayersDocs.find((cp)=> cp.id===score.id)
            return (
              <motion.tr layout variants={scoreVar} initial='hidden' animate='visible' transition={{type:'spring',delay: 0.5+i*0.05}} className={rowClass} key={player.id}>
                {inModal && <td><img src={setDisplayImage(player)} alt="player"/></td>}
                <td>{score.place}</td>
                <td>{score.score}</td>
                <td>{showName(player)}</td>
                <td>{`${score.wins}/${score.games}`}</td>
              </motion.tr>
            )
          })}
      </motion.table>
    </div>
  )
}
