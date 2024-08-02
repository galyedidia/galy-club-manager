import ScoreBoard from "./ScoreBoard";
import { motion } from "framer-motion";

export default function ScoreboardModal( {scoreboard, done, allClubPlayersDocs , maxShow, isEn} ) {
  const backdropVar = {
    hidden:{opacity:0},
    visible:{opacity:1}
  }
  const modalVar = {
    hidden:  {opacity: 0, x: "50vw", y: "30vh", scale: 0 },
    visible: {opacity: 1, x: 0,      y: 0,       scale: 1, transition: {duration: 0.9, type: 'spring'}
    }
  }
  return (
    <motion.div className="modal-background"
      variants={backdropVar}
      initial="hidden"
      animate="visible"
      exit="hidden"
      onClick={done}
    >
      <motion.div variants={modalVar}>
        <ScoreBoard maxShow={maxShow} scoreBoard={scoreboard} clickOnScoreboard={done} allClubPlayersDocs={allClubPlayersDocs} inModal={true} isEn={isEn}/>
      </motion.div>
    </motion.div>
  )
}
