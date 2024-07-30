import { motion } from "framer-motion";

export default function EndSessionErrorModal({done,isEn}) {
  const backdropVar = {
    hidden:{opacity:0},
    visible:{opacity:1}
  }
  const modalVar = {
    hidden:  {opacity: 0, x: "70vw", y: "100vh", scale: 0 },
    visible: {opacity: 1, x: 0,      y: 0,       scale: 1, transition: {duration: 0.9, type: 'spring'}
    }
  }
  return (
    <motion.div className="modal-background"
      variants={backdropVar}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <motion.div className='end-session-modal-container'
        variants={modalVar}
        initial="hidden"
        animate="visible"
        exit="hidden"
        >
      <p>{isEn?'To end the session, you must end all active games':'כדי לסיים את האימון יש לסיים את כל המשחקים הפעילים'}</p>
        <button className="btn" onClick={done} >Ok</button>
      </motion.div>
    </motion.div>
  )
}
