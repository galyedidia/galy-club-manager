import { useEffect, useState } from "react"
import { useAuthContext } from "../hooks/useAuthContext"
import { useFirestore } from "../hooks/useFirestore"
import { motion } from "framer-motion"


export default function AddPlayer( {handleAdd, handleCancel, inSession=false, isEn }) {
  
  // States
  const [firstName, setFirstName] = useState('')
  const [familyName, setFamilyName] = useState('')
  
  // Get User
   const { user } = useAuthContext()
 
  // Firestore Hook for Players
  const {addDocument, response } = useFirestore('players')

  const handleAddPlayer = async (e) => {
    e.preventDefault()
    const player = {
      clubId: user.clubId, 
      firstName, 
      familyName, 
      nickName: '',
      isCoach: false, 
      isNormalRate: true, 
      sessionRate: 0,
      maxMonthlyRate: 0,
      inSession, 
      lastAttendance: null, 
      coachInCourt: false,
      dob: '',
      email: '',
      phone: '',
      rank: ''
    }
    await addDocument(player)
  }

  useEffect(()=> {
    if (response.success) {
      handleAdd(response.document.id)
    }
  },[response, handleAdd])
  const textVar = {
    hidden:  {scale:0.7,rotateZ:8},
    visible: {scale:1,rotateZ:0,transition:{type:'spring'}}
  }
  return (
    <form  className='auth-form' onSubmit={handleAddPlayer}>
        <motion.h2 variants={textVar} initial='hidden' animate='visible'>{isEn?'Add New Club Member':'הוספת חבר מועדון חדש'}</motion.h2>
        <motion.label variants={textVar} initial='hidden' animate='visible'>
          <span>{isEn?'First Name':'שם פרטי'}</span>
          <input type="text" value={firstName} onChange={(e)=>setFirstName(e.target.value)} required />
        </motion.label>
        <motion.label variants={textVar} initial='hidden' animate='visible'>
          <span>{isEn?'Family Name':'שם משפחה'}</span>
          <input type="text" value={familyName} onChange={(e)=>setFamilyName(e.target.value)} required />
        </motion.label>
        <motion.span variants={textVar} initial='hidden' animate='visible' className="auth-form-btns">
          <button className='btn'>{isEn?'Add':'הוספה'}</button>     
          <button className='btn' onClick={handleCancel}>{isEn?'Cancel':'ביטול'}</button>
        </motion.span>
    </form>
  )
}
