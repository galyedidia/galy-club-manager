import { motion } from 'framer-motion'

export default function ConstraintWarningModal({ warning, onConfirm, onCancel, isEn }) {
  if (!warning) return null

  const { droppedPlayerName, conflictingPlayerName, reason, notes } = warning

  const backdropVar = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  }

  const modalVar = {
    hidden: { opacity: 0, scale: 0.7, y: -40 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, type: 'spring', damping: 20 } }
  }

  const reasonBadge = () => {
    if (reason === 'FORBIDDEN_COURT') {
      return isEn ? '⛔ לא על אותו מגרש' : '⛔ לא על אותו מגרש'
    }
    return isEn ? '🚫 לא כבני זוג' : '🚫 לא כבני זוג'
  }

  const descriptionText = () => {
    if (reason === 'FORBIDDEN_COURT') {
      return isEn
        ? `Note: It is defined not to place ${droppedPlayerName} and ${conflictingPlayerName} on the same court.`
        : `הוגדר שלא לשבץ את ${droppedPlayerName} ו-${conflictingPlayerName} על אותו מגרש.`
    }
    return isEn
      ? `Note: It is defined not to place ${droppedPlayerName} and ${conflictingPlayerName} together as partners.`
      : `הוגדר שלא לשבץ את ${droppedPlayerName} ו-${conflictingPlayerName} כבני זוג באותו צד.`
  }

  return (
    <motion.div
      className="modal-background"
      variants={backdropVar}
      initial="hidden"
      animate="visible"
      exit="hidden"
      onClick={onCancel}
    >
      <motion.div
        className="constraint-warning-modal-container"
        variants={modalVar}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="constraint-warning-icon">💡</div>
        
        <h2>{isEn ? 'Matchmaking Preference' : 'שימת לב: העדפת שיבוץ'}</h2>
        
        <div className="constraint-warning-badge-wrap">
          <span className="constraint-badge-tag">{reasonBadge()}</span>
        </div>

        <p className="constraint-warning-desc">{descriptionText()}</p>

        <p className="constraint-warning-prompt">
          {isEn ? 'Would you like to place them anyway?' : 'האם לשבץ אותם בכל זאת?'}
        </p>

        <div className="constraint-warning-btn-row">
          <button type="button" className="btn btn-warning-override" onClick={onConfirm}>
            {isEn ? '✓ Place Anyway' : '✓ כן, שבץ בכל זאת'}
          </button>
          <button type="button" className="btn btn-warning-cancel" onClick={onCancel}>
            {isEn ? '✕ Cancel' : '✕ ביטול'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
