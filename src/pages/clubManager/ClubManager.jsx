import ClubSettings from './ClubSettings';
import { useState } from 'react';
import AllPlayers from './AllPlayers';
import AddPlayer from '../../components/AddPlayer';
import EditPlayer from './EditPlayer';

import './ClubManager.css'
import Sessions from './Sessions';
import SessionReport from './SessionReport';
import Payments from './Payments';
import PaymentReport from './PaymentReport';
import { useAuthContext } from '../../hooks/useAuthContext';
import { useDocument } from '../../hooks/useDocument';
export default function ClubManager() {

  // Get the user state
  const { user } = useAuthContext()

  // Get Club document
  const { document: clubDoc } = useDocument('clubs',user.clubId)
  const isEn = () => clubDoc.lang==='Eng'
  const payMsgIsEn = () => clubDoc.payLang==='Eng'

  const [contentType, setContentType] = useState('NONE')
  const [sessionReport, setSessionReport] = useState('')
  const [paymentReport, setPaymentReport] = useState('')
  const [playerId, setPlayerId] = useState('')

  const handleAddPlayer = (id) => {
    setPlayerId(id)
    setContentType('EDIT-PLAYER')
  }
  const handleAddCancel = () => {
    setContentType('NONE')
  }
  const handleEditPlayer = (id) => {
    setPlayerId(id)
    setContentType('EDIT-PLAYER')
  }
  const handleViewSession = (session) => {
    setSessionReport(session)
    setContentType('A-SESSION')
  }
  const handleViewPaymentReport = (paymentId) => {
    setPaymentReport(paymentId)
    setContentType('PAYMENT-REPORT')
  }

  const btnClassNameClubSettings = 'plink' + (contentType==='CLUB-SETTINGS'?' selected':'')
  const btnClassNameAddPlayer    = 'plink' + (contentType==='ADD-PLAYER'   ?' selected':'')
  const btnClassNamePlayers      = 'plink' + (contentType==='PLAYERS'||contentType==='EDIT-PLAYER'?' selected':'')
  const btnClassNameSessions     = 'plink' + (contentType==='SESSIONS'||contentType==='A-SESSION' ?' selected':'')
  const btnClassNamePayments     = 'plink' + (contentType==='PAYMENTS'||contentType==='PAYMENT-REPORT' ?' selected':'')
  
  return (
    <>
      {clubDoc && <div style={{direction:isEn()?'ltr':'rtl'}} className='club-manager'>
        <div className='sidebar'>
          <p className={btnClassNameClubSettings} onClick={()=>{setContentType('CLUB-SETTINGS')}}>{isEn()?'Club Settings':'הגדרות מועדון'}</p>
          <p className={btnClassNameAddPlayer}    onClick={()=>{setContentType('ADD-PLAYER')}}   >{isEn()?'Add New Player':'הוסף שחקן חדש'}</p>
          <p className={btnClassNamePlayers}    onClick={()=>{setContentType('PLAYERS')}}        >{isEn()?'All Players':'כל השחקנים'}</p>
          <p className={btnClassNameSessions}    onClick={()=>{setContentType('SESSIONS')}}      >{isEn()?'Sessions':'אימונים'}</p>
          <p className={btnClassNamePayments}    onClick={()=>{setContentType('PAYMENTS')}}      >{isEn()?'Payments':'תשלומים'}</p>
        </div>
        <div className='content'>
          {contentType==='CLUB-SETTINGS' && <ClubSettings done={()=>{setContentType('NONE')}}/>}
          {contentType==='ADD-PLAYER' && <AddPlayer handleAdd={handleAddPlayer} handleCancel={handleAddCancel} isEn={isEn()}/>}
          {contentType==='PLAYERS' && <AllPlayers handleEditPlayer={handleEditPlayer} isEn={isEn()}/>}
          {contentType==='EDIT-PLAYER' && <EditPlayer playerId={playerId} done={()=>{setContentType('PLAYERS')}} isEn={isEn()}/>}
          {contentType==='SESSIONS' && <Sessions viewSession={handleViewSession } isEn={isEn()}/>}
          {contentType==='A-SESSION' && <SessionReport session={sessionReport} isEn={isEn()}/>}
          {contentType==='PAYMENTS' && <Payments viewMonthlyPayment={handleViewPaymentReport} isEn={isEn()}/>}
          {contentType==='PAYMENT-REPORT' && <PaymentReport paymentId={paymentReport} isEn={isEn()} payMsgIsEn={payMsgIsEn()}/>}
          {contentType==='NONE' && clubDoc.logoURL!== '' && <img className='content-img' src={clubDoc.logoURL} alt="logo of club"/>}
        </div>
      </div>}
    </>
  )
}
