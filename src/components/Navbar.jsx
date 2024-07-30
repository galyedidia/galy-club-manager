import './Navbar.css'

import { Link } from 'react-router-dom'
import { useLogout } from '../hooks/useLogout'
import { useAuthContext } from '../hooks/useAuthContext'
import { useDocument } from '../hooks/useDocument'
import Log from './LogUtil'
import { useState } from 'react'
import LogoutConfirmModal from './LogoutConfirmModal'

export default function Navbar() {
  const [showModal,setShowModal] = useState(false)

  // Get the user state
  const { user } = useAuthContext()

  // Get Club document
  const { document: clubDoc, useDocumentError } = useDocument('clubs',user.clubId)

  // Log out Hook
  const { logout, isPending } = useLogout()
  const isEn = () => clubDoc.lang==='Eng'
  const role = clubDoc ? user.isManager ? isEn()?'Manager':'מנהל מועדון': 
          (user.isCoach ? isEn()?'Coach':'מאמן' : isEn()?'Viewer':'צופה') : ''
          
          
  Log("Navbar","role",role)
  
  return (
    <div className='navbar'>
      {clubDoc && showModal && <LogoutConfirmModal isEn={isEn()} cancel={()=>setShowModal(false)} ok={logout}/>}
      {clubDoc && <ul>
        <li className='logo'>
          {clubDoc.logoURL !== '' && <img src={clubDoc.logoURL} alt="logo of club"/>}
          {/* <span className='role'>{role}</span> */}
        </li>
        <li className='logo'><span className='navbar-title'>{clubDoc && clubDoc.name}</span></li>
        {user.isManager && <li><Link to="/">{isEn()?'Session':'אימון'}</Link></li>}
        {user.isManager && <li><Link to="/club-manager">{isEn()?'Manage Club':'ניהול מועדון'}</Link></li>}
        {!isPending && <li><button className='btn' onClick={()=>setShowModal(true)}>{isEn()?'Log-Out':'התנתק'}</button></li>}
        {isPending && <li><button className='btn' disabled>{isEn()?'Logging out...':'...מתנתק'}</button></li>}
        {useDocumentError && <div className='error'>{useDocumentError}</div>}
      </ul>}    
    </div>
  )
}
