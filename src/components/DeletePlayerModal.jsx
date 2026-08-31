import { motion } from 'framer-motion'
import birdie from '../assets/birdie.jpg'

export default function DeletePlayerModal({ player, onConfirm, onCancel, isDeleting, isEn, error }) {
  if (!player) return null

  const backdropVar = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  }

  const modalVar = {
    hidden: { opacity: 0, scale: 0.85, y: -20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 300 } }
  }

  const firstName = player.firstName || ''
  const familyName = player.familyName || ''
  const fullName = `${firstName} ${familyName}`.trim() || (isEn ? 'Unnamed Player' : 'שחקן ללא שם')
  const photo = player.photoURL || birdie

  return (
    <motion.div
      className="modal-backdrop"
      variants={backdropVar}
      initial="hidden"
      animate="visible"
      exit="hidden"
      onClick={onCancel}
    >
      <motion.div
        className="modal-content delete-player-confirm-modal"
        variants={modalVar}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#35153b',
          border: '2px solid var(--heading-color)',
          borderRadius: '12px',
          padding: '3vh 2.5vw',
          maxWidth: '460px',
          width: '90vw',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ fontSize: '3.2vh', marginBottom: '1vh' }}>⚠️</div>
        
        <h2 style={{ color: 'var(--heading-color)', fontSize: '2.4vh', margin: '0 0 1.5vh 0' }}>
          {isEn ? 'Delete Club Member' : 'מחיקת חבר מועדון'}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', margin: '1.5vh 0' }}>
          <img
            src={photo}
            alt={fullName}
            style={{
              width: '6.5vh',
              height: '6.5vh',
              borderRadius: '38%',
              objectFit: 'cover',
              border: '2px solid var(--card-color)'
            }}
          />
          <span style={{ fontSize: '2.2vh', fontWeight: 600, color: 'var(--heading-color)' }}>
            {fullName}
          </span>
          {player.nickName && (
            <span style={{ fontSize: '1.8vh', color: 'var(--text-color)' }}>
              ({player.nickName})
            </span>
          )}
        </div>

        <p style={{ color: '#fff', fontSize: '1.9vh', lineHeight: '1.5', margin: '1vh 0 2.5vh 0' }}>
          {isEn
            ? `Are you sure you want to delete this player? This action cannot be undone.`
            : `האם אתה בטוח שברצונך למחוק שחקן זה? פעולה זו תסיר את השחקן מהמועדון לצמיתות.`}
        </p>

        {error && (
          <div className="error" style={{ marginBottom: '2vh', fontSize: '1.6vh' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1.5vw', justifyContent: 'center' }}>
          <button
            type="button"
            className="btn"
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              backgroundColor: '#dc2626',
              borderColor: '#ef4444',
              color: '#fff',
              fontSize: '1.8vh',
              padding: '0.8vh 1.8vw'
            }}
          >
            {isDeleting ? (isEn ? 'Deleting...' : 'מוחק...') : (isEn ? '✓ Yes, Delete' : '✓ כן, מחק שחקן')}
          </button>
          
          <button
            type="button"
            className="btn"
            onClick={onCancel}
            disabled={isDeleting}
            style={{ fontSize: '1.8vh', padding: '0.8vh 1.8vw' }}
          >
            {isEn ? '✕ Cancel' : '✕ ביטול'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
