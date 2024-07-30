import React from 'react'
import {motion} from 'framer-motion'

export default function LogoutConfirmModal({ isEn, ok, cancel }) {
    const backdropVar = {
      hidden:{opacity:0},
      visible:{opacity:1}
    }
    const modalVar = {
      hidden:  {opacity: 0, x: "70vw", y: "-30vh", scale: 0 },
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
        >
          <p>{isEn?'Are you sure you want to Logout?':'?אתה בטוח שאתה רוצה להתנתק'}</p>
          <span>
            <button className="btn" onClick={ok} >{isEn?'Ok':'כן'}</button>
            <button className="btn" onClick={cancel} >{isEn?'Cancel':'ביטול'}</button>
          </span>
        </motion.div>
      </motion.div>
  )
}
