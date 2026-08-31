import { useEffect, useState } from 'react'
import { useDocument } from '../../hooks/useDocument'
import { useFirestore } from '../../hooks/useFirestore'
import { useAuthContext } from '../../hooks/useAuthContext'
import { useCollection } from '../../hooks/useCollection'
import { projectStorage } from '../../firebase/config'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import Select from 'react-select'
import { dateStringToTimestamp, timestampToDate } from './timeUtil'
import { motion, AnimatePresence } from 'framer-motion'
import PlayerRestrictionsModal from './PlayerRestrictionsModal'
import DeletePlayerModal from '../../components/DeletePlayerModal'

const yesNoOptions = [
  { value: true, label: 'Yes' },
  { value: false, label: 'No' }
]

export default function EditPlayer({ playerId, done, isEn }) {

  const textVar = {
    hidden: { scale: 0.7, rotateZ: 8 },
    visible: { scale: 1, rotateZ: 0, transition: { type: 'spring' } }
  }

  const [showRestrictionsModal, setShowRestrictionsModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  // Get User and all club players for restrictions selector
  const { user } = useAuthContext()
  const { documents: allClubPlayersDocs } = useCollection(
    'players',
    user?.clubId ? ['clubId', '==', user.clubId] : null,
    null,
    null
  )

  // Get Player document
  const { document: playerDoc, useDocumentError } = useDocument('players', playerId)

  // Get a handle on Update & Delete
  const { updateDocument, deleteDocument, response } = useFirestore('players')

  const [firstName, setFirstName] = useState('')
  const [familyName, setFamilyName] = useState('')
  const [nickName, setNickName] = useState('')
  const [isCoach, setIsCoach] = useState(false)
  const [isNormalRate, setIsNormalRate] = useState(false)
  const [sessionRate, setSessionRate] = useState('')
  const [maxMonthlyRate, setMaxMonthlyRate] = useState('')
  const [dob, setDob] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [rank, setRank] = useState('')

  const [currentPhoto, setCurrentPhoto] = useState(null)
  const [photoChanged, setPhotoChanged] = useState(false)

  // Handle the photo Pick
  const [photo, setPhoto] = useState(null)
  const [photoError, setPhotoError] = useState(null)

  useEffect(() => {
    if (playerDoc) {
      setFirstName(playerDoc.firstName)
      setFamilyName(playerDoc.familyName)
      setNickName(playerDoc.nickName ? playerDoc.nickName : '')
      setCurrentPhoto(playerDoc.photoURL)
      setIsCoach(playerDoc.isCoach ? { value: true, label: 'Yes' } : { value: false, label: 'No' })
      setIsNormalRate(playerDoc.isNormalRate ? { value: true, label: 'Yes' } : { value: false, label: 'No' })
      setSessionRate(playerDoc.sessionRate ? playerDoc.sessionRate : '')
      setMaxMonthlyRate(playerDoc.maxMonthlyRate ? playerDoc.maxMonthlyRate : '')
      setEmail(playerDoc.email ? playerDoc.email : '')
      setPhone(playerDoc.phone ? playerDoc.phone : '')
      setDob(playerDoc.dob ? timestampToDate(playerDoc.dob) : '')
      setRank(playerDoc.rank !== undefined ? playerDoc.rank : 3)
    }
  }, [playerDoc])

  const handleFileChange = (e) => {
    setPhoto(null)
    let selected = e.target.files[0]

    if (!selected) {
      setPhotoError(isEn ? 'Please select a file' : 'אנא בחר קובץ')
      return
    }
    if (!selected.type.includes('image')) {
      setPhotoError(isEn ? 'Selected file must be an image' : 'הקובץ שנבחר חייב להיות תמונה')
      return
    }
    if (selected.size > 10000000) {
      setPhotoError(isEn ? 'Image file size must be less than 10MB' : 'גודל קובץ התמונה חייב להיות קטן מ-10MB')
      return
    }

    setPhotoError(null)
    setPhoto(selected)
    setPhotoChanged(true)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()

    let photoURL = currentPhoto
    if (photoChanged) {
      const uploadPath = `players/${user.clubId}/${playerId}`
      const fileRef = storageRef(projectStorage, uploadPath)
      await uploadBytes(fileRef, photo)
      photoURL = await getDownloadURL(fileRef)
    }

    const player = {
      firstName,
      familyName,
      nickName,
      isCoach: isCoach.value,
      isNormalRate: isNormalRate.value,
      sessionRate: Number(sessionRate) || 0,
      maxMonthlyRate: Number(maxMonthlyRate) || 0,
      dob: dob ? dateStringToTimestamp(dob) : '',
      email,
      phone,
      photoURL,
      rank: Number(rank) || 3
    }
    await updateDocument(playerId, player)
  }

  const handleConfirmDelete = async () => {
    if (!playerDoc) return
    setIsDeleting(true)
    setDeleteError(null)

    // 1. Delete player document
    const res = await deleteDocument(playerId)

    if (res && res.success === false) {
      setIsDeleting(false)
      setDeleteError(res.error || (isEn ? 'Failed to delete player' : 'שגיאה במחיקת השחקן'))
      return
    }

    // 2. Clean up any restrictions on other players targeting this player
    if (allClubPlayersDocs) {
      for (const otherPlayer of allClubPlayersDocs) {
        if (otherPlayer.id !== playerId && otherPlayer.restrictions?.some((r) => r.targetPlayerId === playerId)) {
          const updated = otherPlayer.restrictions.filter((r) => r.targetPlayerId !== playerId)
          await updateDocument(otherPlayer.id, { restrictions: updated })
        }
      }
    }

    setIsDeleting(false)
    setShowDeleteConfirm(false)
    done()
  }

  useEffect(() => {
    if (response.success) {
      done()
    }
  }, [response, done])

  return (
    playerDoc && <motion.form className='auth-form' onSubmit={handleUpdate}>
      <motion.h2 variants={textVar} initial='hidden' animate='visible'>{isEn ? 'Player Settings' : 'הגדרות שחקן'}</motion.h2>
      <span className='edit-player-row'>
        <motion.label variants={textVar} initial='hidden' animate='visible'>
          <span>{isEn ? 'First Name' : 'שם פרטי'}</span>
          <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </motion.label>
        <motion.label variants={textVar} initial='hidden' animate='visible'>
          <span>{isEn ? 'Family Name' : 'שם משפחה'}</span>
          <input type="text" value={familyName} onChange={(e) => setFamilyName(e.target.value)} required />
        </motion.label>
        <motion.label variants={textVar} initial='hidden' animate='visible'>
          <span>{isEn ? 'Nick Name' : 'כינוי'}</span>
          <input type="text" value={nickName} onChange={(e) => setNickName(e.target.value)} />
        </motion.label>
      </span>
      <span className='edit-player-row'>
        <motion.label variants={textVar} initial='hidden' animate='visible'>
          <span>{isEn ? 'Date of Birth' : 'תאריך לידה'}</span>
          <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
        </motion.label>
        <motion.label variants={textVar} initial='hidden' animate='visible'>
          <span>{isEn ? 'Email' : 'אימייל'}</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </motion.label>
        <motion.label variants={textVar} initial='hidden' animate='visible'>
          <span>{isEn ? 'Phone (9725...)' : 'טלפון (...9725)'}</span>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} pattern='[0-9]{12}' />
        </motion.label>
      </span>
      <span className='edit-player-row'>
        <motion.label variants={textVar} initial='hidden' animate='visible'>
          <span>{isEn ? 'Player is a Coach?' : 'השחקן הוא מאמן?'}</span>
          <Select
            onChange={(option) => setIsCoach(option)}
            options={yesNoOptions}
            value={isCoach}
            required
          />
        </motion.label>
        <motion.label variants={textVar} initial='hidden' animate='visible'>
          <span>{isEn ? 'Player Rank' : 'דירוג שחקן'}</span>
          <select
            value={rank}
            onChange={(e) => setRank(Number(e.target.value))}
            style={{
              height: '38px',
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid var(--card-color)',
              backgroundColor: 'var(--input-text-bg)',
              color: 'var(--bg-color)',
              fontSize: '1em',
              fontWeight: 500,
              boxSizing: 'border-box',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            <option value={1}>1 - {isEn ? 'Beginner' : 'מתחיל'}</option>
            <option value={2}>2 - {isEn ? 'Mid -' : 'אמצע -'}</option>
            <option value={3}>3 - {isEn ? 'Mid +' : 'אמצע +'}</option>
            <option value={4}>4 - {isEn ? 'Advanced' : 'מתקדם'}</option>
            <option value={5}>5 - {isEn ? 'Elite' : 'תחרותי'}</option>
          </select>
        </motion.label>
        <motion.label className='edit-player-photo' variants={textVar} initial='hidden' animate='visible'>
          <span>{isEn ? 'Player Photo' : 'תמונת שחקן'}</span>
          <div>
            {currentPhoto && <img src={currentPhoto} alt="player" />}
            <input type="file" onChange={handleFileChange} />
          </div>
        </motion.label>
      </span>
      <span className='edit-player-row'>
        <motion.label variants={textVar} initial='hidden' animate='visible'>
          <span>{isEn ? 'Pays Standard Rate?' : 'משלם עלות רגילה?'}</span>
          <Select
            onChange={(option) => setIsNormalRate(option)}
            options={yesNoOptions}
            value={isNormalRate}
            required
          />
        </motion.label>
        {!isNormalRate.value && <motion.label variants={textVar} initial='hidden' animate='visible'>
          <span>{isEn ? 'Single Session Rate' : 'עלות משחק יחיד'}</span>
          <input type="number" value={sessionRate} onChange={(e) => setSessionRate(e.target.value)} required />
        </motion.label>}
        {!isNormalRate.value && <motion.label variants={textVar} initial='hidden' animate='visible'>
          <span>{isEn ? 'Maximum Monthly Rate' : 'עלות מקסימלית לחודש'}</span>
          <input type="number" value={maxMonthlyRate} onChange={(e) => setMaxMonthlyRate(e.target.value)} required />
        </motion.label>}
      </span>

      <motion.span variants={textVar} initial='hidden' animate='visible' className='edit-player-btns'>
        <button className='btn' type="submit">{isEn ? 'Update' : 'עדכון'}</button>
        <button
          type="button"
          className="btn"
          onClick={() => setShowRestrictionsModal(true)}
        >
          {isEn ? 'Restrictions' : 'אילוצי שיבוץ'} {playerDoc?.restrictions?.length ? `(${playerDoc.restrictions.length})` : ''}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => setShowDeleteConfirm(true)}
          style={{ borderColor: 'rgba(239, 68, 68, 0.6)' }}
        >
          🗑️ {isEn ? 'Delete Player' : 'מחק שחקן'}
        </button>
        <button className='btn' type="button" onClick={done}>{isEn ? 'Cancel' : 'ביטול'}</button>
      </motion.span>
      {useDocumentError && <div className='error'>{useDocumentError}</div>}

      {/* Matchmaking Restrictions Modal */}
      <AnimatePresence>
        {showRestrictionsModal && playerDoc && (
          <PlayerRestrictionsModal
            playerDoc={playerDoc}
            allClubPlayersDocs={allClubPlayersDocs || []}
            isEn={isEn}
            done={() => setShowRestrictionsModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Delete Player Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && playerDoc && (
          <DeletePlayerModal
            player={playerDoc}
            onConfirm={handleConfirmDelete}
            onCancel={() => {
              setShowDeleteConfirm(false)
              setDeleteError(null)
            }}
            isDeleting={isDeleting}
            isEn={isEn}
            error={deleteError}
          />
        )}
      </AnimatePresence>
    </motion.form>
  )
}
