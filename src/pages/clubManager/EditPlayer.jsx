import { useEffect, useState } from 'react'
import { useDocument } from '../../hooks/useDocument'
import { useFirestore } from '../../hooks/useFirestore'
import { projectStorage } from '../../firebase/config'
import Select from 'react-select'
import { dateStringToTimestamp, timestampToDate } from './timeUtil'
import { motion } from 'framer-motion'

const yesNoOptions = [
  { value: true, label: 'Yes' },
  { value: false, label: 'No' }
]

export default function EditPlayer( {playerId, done, isEn} ) {
  
  const textVar = {
    hidden:  {scale:0.7,rotateZ:8},
    visible: {scale:1,rotateZ:0,transition:{type:'spring'}}
  }

  // Get Player document
  const { document: playerDoc, useDocumentError } = useDocument('players',playerId)
  
  // Get a handle on Update
  const {updateDocument, response} = useFirestore('players')

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

  useEffect(()=>{
    if (playerDoc) {
      setFirstName(playerDoc.firstName)
      setFamilyName(playerDoc.familyName)
      setNickName(playerDoc.nickName?playerDoc.nickName:'')
      setCurrentPhoto(playerDoc.photoURL)
      setIsCoach(playerDoc.isCoach ? { value: true, label: 'Yes' } : { value: false, label: 'No' })
      setIsNormalRate(playerDoc.isNormalRate ? { value: true, label: 'Yes' } : { value: false, label: 'No' })
      setSessionRate(playerDoc.sessionRate?playerDoc.sessionRate:'')
      setMaxMonthlyRate(playerDoc.maxMonthlyRate?playerDoc.maxMonthlyRate:'')
      setDob(playerDoc.dob ? timestampToDate(playerDoc.dob) : '')
      setEmail(playerDoc.email ? playerDoc.email : '')
      setPhone(playerDoc.phone ? playerDoc.phone : '')
      setRank(playerDoc.rank ? playerDoc.rank : '')
    }
  },[playerDoc])

  const handleUpdate = async (e) => {
    e.preventDefault()
    const dobTimestamp = dateStringToTimestamp(dob)
    if (photoError)
      return
    if (photoChanged && photo) {
      // First upload the player Photo if it got changed, then get the URL 
      // First step is set the upload path
      // Second step is to upload it - if a folder doen't exist - it will create it
      // Third step is to get the image URL from the reference of the stored image
      const uploadPath = `playersPhotos/${playerDoc.id}/${photo}`
      const img = await projectStorage.ref(uploadPath).put(photo)
      const photoURL = await img.ref.getDownloadURL()
      await updateDocument(playerDoc.id,{firstName, familyName, dob:dobTimestamp, email, phone, rank, nickName,  isCoach:isCoach.value, isNormalRate:isNormalRate.value, sessionRate, maxMonthlyRate, photoURL})
    } else {
      await updateDocument(playerDoc.id,{firstName, familyName, dob:dobTimestamp, email, phone, rank, nickName, isCoach:isCoach.value, isNormalRate:isNormalRate.value, sessionRate, maxMonthlyRate})
    }
  }
  useEffect(()=> {
    if (response.success) {
      done()
    }
  },[response,done])

  const handleFileChange = (e) => {
    let selected = e.target.files[0]

    if (!selected) {
      return
    }
    if(!selected.type.includes('image')) {
      setPhotoError('Selected file must be an image')
      return
    }
    if(selected.size > 8000000) {
      setPhotoError('Image file size must be less than 8MB')
      return
    }
    setPhotoError(null)
    setPhotoChanged(true)
    setPhoto(selected)
  }
  return (
    <motion.form className='auth-form' onSubmit={handleUpdate}>
      <h2>{isEn?'Player Settings':'הגדרות שחקן'}</h2>
      <span className='edit-player-row'>
        <motion.label variants={textVar} initial='hidden' animate='visible'>
          <span>{isEn?'First Name':'שם פרטי'}</span>
          <input type="text" value={firstName} onChange={(e)=>setFirstName(e.target.value)} required />
        </motion.label>
        <motion.label variants={textVar} initial='hidden' animate='visible'>
          <span>{isEn?'Family Name':'שם משפחה'}</span>
          <input type="text" value={familyName} onChange={(e)=>setFamilyName(e.target.value)} required />
        </motion.label>
        <motion.label variants={textVar} initial='hidden' animate='visible'>
          <span>{isEn?'Nick Name':'כינוי'}</span>
          <input type="text" value={nickName} onChange={(e)=>setNickName(e.target.value)} />
        </motion.label>
      </span>
      <span className='edit-player-row'>
        <motion.label variants={textVar} initial='hidden' animate='visible'>
          <span>{isEn?'Date Of Birth':'תאריך לידה'}</span>
          <input type="date" value={dob} onChange={(e)=>setDob(e.target.value)} required/>
        </motion.label>
        <motion.label variants={textVar} initial='hidden' animate='visible'>
          <span>{isEn?'E-Mail':'אימייל'}</span>
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        </motion.label>
        <motion.label variants={textVar} initial='hidden' animate='visible'>
          <span>{isEn?'Phone Number (9725x...)':'טלפון (...9725)'}</span>
          <input type="tel" value={phone} onChange={(e)=>setPhone(e.target.value)} pattern='[0-9]{12}'/>
        </motion.label>
      </span>
      <span className='edit-player-row'>
        <motion.label variants={textVar} initial='hidden' animate='visible'>
          <span>{isEn?'Player is a Coach?':'השחקן הוא מאמן?'}</span>
          <Select
              onChange={(option) => setIsCoach(option)}
              options={yesNoOptions}
              value={isCoach}
              required
            />
        </motion.label>
        <motion.label variants={textVar} initial='hidden' animate='visible'>
          <span>{isEn?'Player Rank':'דירוג שחקן'}</span>
          <input type="number" value={rank} onChange={(e)=>setRank(e.target.value)}/>
        </motion.label>
        <motion.label className='edit-player-photo' variants={textVar} initial='hidden' animate='visible'>
          <span>{isEn?'Player Photo':'תמונת שחקן'}</span>
          <div>
            <input type="file" onChange={handleFileChange} />
            {currentPhoto && <motion.img initial={{delay:2}}animate={{rotateZ:360, duration:3}}src={currentPhoto} alt="player"/>}
            {photoError && <div className='error'>{photoError}</div>}
          </div>
        </motion.label>
      </span>
      <span className='edit-player-row'>
        <motion.label variants={textVar} initial='hidden' animate='visible'>
          <span>{isEn?'Pays Standard Rate?':'משלם עלות רגילה?'}</span>
          <Select
              onChange={(option) => setIsNormalRate(option)}
              options={yesNoOptions}
              value={isNormalRate}
              required
            />
        </motion.label>
        {!isNormalRate.value && <motion.label variants={textVar} initial='hidden' animate='visible'>
          <span>{isEn?'Single Session Rate':'עלות משחק יחיד'}</span>
          <input type="number" value={sessionRate} onChange={(e)=>setSessionRate(e.target.value)} required />
        </motion.label>}
        {!isNormalRate.value && <motion.label variants={textVar} initial='hidden' animate='visible'>
          <span>{isEn?'Maximum Monthly Rate':'עלות מקסימלית לחודש'}</span>
          <input type="number" value={maxMonthlyRate} onChange={(e)=>setMaxMonthlyRate(e.target.value)} required />
        </motion.label>}
      </span>
      <motion.span variants={textVar} initial='hidden' animate='visible' className='edit-player-btns'>
        <button className='btn'>{isEn?'Update':'עדכון'}</button>
        <button className='btn' onClick={done}>{isEn?'Cancel':'ביטול'}</button>
      </motion.span>
      {useDocumentError && <div className='error'>{useDocumentError}</div>}
    </motion.form>
  )
}
