import { useEffect, useState } from 'react'
import { useAuthContext } from '../../hooks/useAuthContext'
import { useDocument } from '../../hooks/useDocument'
import { useFirestore } from '../../hooks/useFirestore'
import { projectStorage } from '../../firebase/config'

import { motion } from 'framer-motion'
import Select from 'react-select'

export default function ClubSettings( {done} ) {
  
  const textVar = {
    hidden:  {scale:0.7,rotateZ:8},
    visible: {scale:1,rotateZ:0,transition:{type:'spring'}}
  }

  const langOptions = [
    { value: 'Eng', label: 'English' },
    { value: 'Heb', label: 'עברית' }
  ]
  
  // Get User
  const { user } = useAuthContext()

  // Get Club document
  const { document: clubDoc, useDocumentError } = useDocument('clubs',user.clubId)
  const isEn = () => clubDoc.lang==='Eng'

  // Get a handle on Update
  const {updateDocument} = useFirestore('clubs')

  const [name, setName] = useState('')
  const [currentLogo, setCurrentLogo] = useState(null)
  const [lang,setLang] = useState('Eng')
  const [payLang,setPayLang] = useState('Eng')
  const [sessionRate, setSessionRate] = useState('')
  const [maxMonthlyRate, setMaxMonthlyRate] = useState('')
  const [logoChanged, setLogoChanged] = useState(false)

  // Handle the logo Pick
  const [logo, setLogo] = useState(null)
  const [logoError, setLogoError] = useState(null)

  useEffect(()=>{
    if (clubDoc) {
      setName(clubDoc.name)
      setCurrentLogo(clubDoc.logoURL)
      setLang(clubDoc.lang === 'Eng' ? { value: 'Eng', label: 'English' } : { value: 'Heb', label: 'עברית' })
      setPayLang(clubDoc.payLang === 'Eng' ? { value: 'Eng', label: 'English' } : { value: 'Heb', label: 'עברית' })
      setSessionRate(clubDoc.sessionRate)
      setMaxMonthlyRate(clubDoc.maxMonthlyRate)
    }
  },[clubDoc])

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (logoError)
      return
    if (logoChanged) {
      // First upload the Club logo if it got changed, then get the URL 
      // First step is set the upload path
      // Second step is to upload it - if a folder doen't exist - it will create it
      // Third step is to get the image URL from the reference of the stored image
      const uploadPath = `clubsLogos/${clubDoc.id}/${logo}`
      const img = await projectStorage.ref(uploadPath).put(logo)
      const logoURL = await img.ref.getDownloadURL()
      await updateDocument(clubDoc.id,{name, lang: lang.value, payLang: payLang.value, sessionRate, maxMonthlyRate, logoURL})
    } else {
      await updateDocument(clubDoc.id,{name, lang: lang.value, payLang: payLang.value, sessionRate, maxMonthlyRate})
    }
    //setTimeout(() => {done()},300)
  }
  // useEffect(()=> {
  //   if (response.success) {
  //     done()
  //   }
  // },[response,done])

  const handleFileChange = (e) => {
    setLogoChanged(true)
    setLogo(null)
    let selected = e.target.files[0]

    if (!selected && !currentLogo) {
      setLogoError('Please select a file')
      return
    }
    if(!selected.type.includes('image')) {
      setLogoError('Selected file must be an image')
      return
    }
    if(selected.size > 8000000) {
      setLogoError('Image file size must be less than 8MB')
      return
    }
    setLogoError(null)
    setLogo(selected)
  }

  return (
    <>
      {clubDoc && <form className='auth-form' style={{direction:isEn()?'ltr':'rtl'}} onSubmit={handleUpdate}>
        <h2>{isEn()?'Club Settings':'הגדרות מועדון'}</h2>
        <span className='edit-player-row'>
          <motion.label variants={textVar} initial='hidden' animate='visible'>
            <span>{isEn()?'Club Name':'שם מועדון'}</span>
            <input type="text" value={name} onChange={(e)=>setName(e.target.value)} required />
          </motion.label>
          <motion.label variants={textVar} initial='hidden' animate='visible'>
            <span>{isEn()?'Language':'שפה'}</span>
            <Select
                onChange={(option) => setLang(option)}
                options={langOptions}
                value={lang}
                required
              />
          </motion.label>
          <motion.label variants={textVar} initial='hidden' animate='visible'>
            <span>{isEn()?'Payment Msg Language':'שפה להודעת תשלום'}</span>
            <Select
                onChange={(option) => setPayLang(option)}
                options={langOptions}
                value={payLang}
                required
              />
          </motion.label>
        </span>
        <span className='edit-player-row'>
          <motion.label variants={textVar} initial='hidden' animate='visible'>
            <span>{isEn()?'Single Session Rate':'עלות אימון יחיד'}</span>
            <input type="number" value={sessionRate} onChange={(e)=>setSessionRate(e.target.value)} required />
          </motion.label>
          <motion.label variants={textVar} initial='hidden' animate='visible'>
            <span>{isEn()?'Maximum Monthly Rate':'עלות מקסימלית לחודש'}</span>
            <input type="number" value={maxMonthlyRate} onChange={(e)=>setMaxMonthlyRate(e.target.value)} required />
          </motion.label>
          <motion.label className='edit-club-photo' variants={textVar} initial='hidden' animate='visible'>
            <span>{isEn()?'Club Logo':'לוגו המועדון'}</span>
            <div>
              <input type="file" onChange={handleFileChange} />
              {currentLogo && <motion.img initial={{delay:2}}animate={{rotateZ:360, duration:3}}src={currentLogo} alt="logo"/>}
              {logoError && <div className='error'>{logoError}</div>}
            </div>
          </motion.label>
        </span>
        <motion.span variants={textVar} initial='hidden' animate='visible' className='edit-club-btns'>
          {<motion.button variants={textVar} initial='hidden' animate='visible' className='btn'>{isEn()?'Update':'עדכון'}</motion.button>}
          {<motion.button variants={textVar} initial='hidden' animate='visible' className='btn' onClick={done} >{isEn()?'Cancel':'ביטול'}</motion.button>}
        </motion.span>
        {useDocumentError && <div className='error'>{useDocumentError}</div>}
      </form>}
    </>
  )

}
