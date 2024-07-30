import { useState } from "react"
import AddPlayer from "../../components/AddPlayer"
import searchPersonImg from '../../assets/person_search.png'
import { motion } from "framer-motion";
import Log from "../../components/LogUtil";
import birdie from '../../assets/birdie.jpg'

export default function AddPlayersModal( { playersNotAtSession, handleAddPlayer, done, isEn }) {
  const backdropVar = {
    hidden:{opacity:0},
    visible:{opacity:1}
  }
  const modalVar = {
    hidden:  {opacity: 0, x: "50vw", y: 0, scale: 0 },
    visible: {opacity: 1, x: 0,      y: 0,       scale: 1, transition: {duration: 0.9, type: 'spring'}
    }
  }
  const playerVar = {
    hidden: {opacity:0, scale:0},
    visible: {opacity:1, scale:1},
  }
  //States
  const [addNewMember, setAddNewMember] = useState(false)
  const [serachText, setSearchText] = useState('')
  
  const handleAdd = (id) => {
    handleAddPlayer(id)
    setAddNewMember(false)
  }

  const match = (text) => {
    return text.toLowerCase().includes(serachText.toLowerCase())
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

  Log('AddPlayersModal','playersNotAtSession',playersNotAtSession)
  const coaches = serachText ==='' ? playersNotAtSession.filter((p)=>p.isCoach) : []
  const sortedPlayers = playersNotAtSession.filter((p)=>!p.isCoach).sort((p1,p2)=> p1.firstName > p2.firstName ? 1 : -1)
  const filterPlayers = serachText ==='' ? sortedPlayers : sortedPlayers.filter((p)=> match(p.firstName) || match(p.familyName))
  const playerToShow = [...coaches,...filterPlayers]
  const noPlayersText = playerToShow.length === 0 ? sortedPlayers.length > 0 ? isEn?'No matching Players':'לא נמצאו שחקנים מתאימים' : isEn?'All Players are in the session!':'!כל השחקנים באימון' : ''
  return (
    <motion.div className="modal-background"
      variants={backdropVar}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <motion.div className="add-players-modal-container" variants={modalVar} style={{direction:isEn?'ltr':'rtl'}}>
        <h2>{isEn?'Add Players to Session':'הוספת שחקנים לאימון'}</h2>
        <button className="btn add-players-modal-done" onClick={done}> X </button>
        {!addNewMember && <button className="btn add-players-modal-new-member" onClick={()=>setAddNewMember(true)}>{isEn?' Add a New Club Member! ':'הוספת חבר מועדון חדש'}</button>}
        {addNewMember && <AddPlayer handleAdd={handleAdd} handleCancel={()=>setAddNewMember(false)} isEn={isEn}/>}
        {!addNewMember && <div>
          <span className="add-players-modal-search">
            <input type="text" value={serachText} onChange={(e)=>setSearchText(e.target.value)} />
            <img src={searchPersonImg} alt="search" />
          </span>
          <div className="add-players-modal-cards-container">
            <ul className="add-players-modal-cards-wrapper"> 
              {playerToShow.length === 0 && <div>{noPlayersText}</div>}
              {playerToShow.length >   0 && playerToShow.map((player,i)=> (
                <motion.li layout variants={playerVar} transition={{delay: 0.2+i*0.05}} className="li-list" key={player.id}>
                  <img src={setDisplayImage(player)} alt="player"/>
                  {/* <span><button className="btn" onClick={()=> handleAddPlayer(player.id)}> + </button>{player.isCoach && ' Coach - '} {player.firstName} {player.familyName} </span> */}
                  <span onClick={()=> handleAddPlayer(player.id)}>{player.isCoach && ' Coach - '} {player.firstName} {player.familyName}{player.nickName ?` (${player.nickName})`:''} </span>
              </motion.li>))}
            </ul>
          </div>
        </div>}
      </motion.div>
    </motion.div>
  )
}
