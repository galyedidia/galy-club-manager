import { motion } from "framer-motion";
import GamesTable from "../clubManager/GamesTable";
export default function DoneGamesModal( {allClubPlayersDocs, session, isEn, done, playerId } ) {
    const backdropVar = {
        hidden:{opacity:0},
        visible:{opacity:1}
    }
    const modalVar = {
        hidden:  {opacity: 0, x: 0, y: 0, scale: 0 },
        visible: {opacity: 1, x: 0,      y: 0,       scale: 1, transition: {duration: 0.9, type: 'spring'}}
    }
    const getSeconds = (firebaseDate) => {
        return firebaseDate ? firebaseDate.seconds : ''
    }
    const allPlayerGames = session.doneGames.filter((game) => game.winTeam.includes(playerId) || game.loseTeam.includes(playerId))
                          .sort((a,b) => {return (getSeconds(a.startTime) > getSeconds(b.startTime)) ? 1 : -1})

    return (
    <motion.div className="modal-background"
        variants={backdropVar}
        initial="hidden"
        animate="visible"
        exit="hidden"
        onClick={done}
        style={{direction:isEn?'ltr':'rtl'}}
    >
        <motion.div variants={modalVar} className="done-games-container">
            <GamesTable allClubPlayersDocs={allClubPlayersDocs} doneGames={allPlayerGames} isEn={isEn} lastGameStat={true} specificPlayerId={playerId}/>
        </motion.div>
    </motion.div>
    )
}
