
import { useState } from "react"
import { useAuthContext } from "../../hooks/useAuthContext"
import { useCollection } from "../../hooks/useCollection"
import editPlayer from '../../assets/editPlayer.png'
import { motion } from "framer-motion"
export default function AllPlayers( {handleEditPlayer, isEn}) {

  const rowVar = {
    hidden: {opacity:0, scale:0.75},
    visible: {opacity:1, scale:1},
  }

  const [sortBy, setSortBy] = useState('FIRST-NAME')
  const [ascendSort, setAscendSort] = useState(false)

  // Get User
   const { user } = useAuthContext()

  // Get Players 
  const { documents:allClubPlayersDocs } = useCollection (
    'players',
    ["clubId","==",user.clubId],
    null,
    null//["firstName","desc"]
  )
  const formatDate = (firebaseDate) => {
    if (firebaseDate) {
      const date = new Date(firebaseDate.seconds*1000)
      return `${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}`
    } else {
      return ''
    }
  }
  const getSeconds = (firebaseDate) => {
    return firebaseDate ? firebaseDate.seconds : ''
  }
  //Sort Players
  const sortedPlayers = allClubPlayersDocs && allClubPlayersDocs.length>0 ? allClubPlayersDocs.sort((a,b) => {
    let sort = 0
    if (sortBy === 'FIRST-NAME'  ) { sort = (a.firstName.toLowerCase()   > b.firstName.toLowerCase()    ) ? -1 : 1 }    
    if (sortBy === 'FAMILY-NAME' ) { sort = (a.familyName.toLowerCase() > b.familyName.toLowerCase()  ) ? -1 : 1 }    
    if (sortBy === 'DOB'         ) { sort = (getSeconds(a.dob)          > getSeconds(b.dob)           ) ? -1 : 1 }    
    if (sortBy === 'LAST-SESSION') { sort = (getSeconds(a.endedLastGame) > getSeconds(b.endedLastGame)) ? -1 :  1 }    
    if (sortBy === 'NORMAL-RATE' ) { sort = (a.isNormalRate  > b.isNormalRate ) ? -1 : 1 }    
    if (sortBy === 'COACHES'     ) { sort = (a.isCoach       > b.isCoach      ) ? -1 : 1 }    
    return ascendSort ? sort : -1*sort
  }): []
  
  const handleSort = (field) => {
    setSortBy((prev)=>{
      if (prev === field) {
        setAscendSort((presAscend)=>!presAscend)
      }
      return field
    })
  }
  const firstNameClassName   = 'table-link' + (sortBy === 'FIRST-NAME'   ? ' table-link-selected' : '')
  const familyNameClassName  = 'table-link' + (sortBy === 'FAMILY-NAME'  ? ' table-link-selected' : '')
  const dobClassName         = 'table-link' + (sortBy === 'DOB'          ? ' table-link-selected' : '')
  const lastSessionClassName = 'table-link' + (sortBy === 'LAST-SESSION' ? ' table-link-selected' : '')
  const normalRateClassName  = 'table-link' + (sortBy === 'NORMAL-RATE'  ? ' table-link-selected' : '')
  const coachesClassName     = 'table-link' + (sortBy === 'COACHES'      ? ' table-link-selected' : '')
  return (
    <div className="club-manager-table-container">
      <div className="club-manager-table-wrapper">
      {sortedPlayers && sortedPlayers.length > 0 &&
        <table>         
          <tr className='club-manager-table-header'>
            <th> </th> 
            <th> </th> 
            <th className={firstNameClassName } onClick={()=> handleSort('FIRST-NAME' )}>{isEn?'First Name':'שם פרטי'}</th>            
            <th className={familyNameClassName} onClick={()=> handleSort('FAMILY-NAME')}>{isEn?'Family Name':'שם משפחה'}</th>            
            <th>{isEn?'Nick Name':'כינוי'}</th>            
            <th className={dobClassName} onClick={()=> handleSort('DOB')}>{isEn?'Birthday':'תאריך לידה'}</th>            
            <th>{isEn?'E-mail':'אימייל'}</th>            
            <th>{isEn?'Phone':'טלפון'}</th>            
            <th className={lastSessionClassName} onClick={()=> handleSort('LAST-SESSION')}>{isEn?'Last Session':'אימון אחרון'}</th>            
            <th className={normalRateClassName } onClick={()=> handleSort('NORMAL-RATE' )}>{isEn?'Normal Rate':'עלות רגילה'}</th>            
            <th className={coachesClassName    } onClick={()=> handleSort('COACHES'     )}>{isEn?'Coach':'מאמן'}</th>            
          </tr>
          {sortedPlayers.map((player,i) => (
            <motion.tr layout variants={rowVar} initial='hidden' animate='visible' transition={{type: 'spring',delay: i*0.05}} key={player.id} className="club-manager-table-rows">
              <td className="table-link" onClick={()=> handleEditPlayer(player.id)}><img src={editPlayer} alt="edit"/></td>
              <td>{player.photoURL && <img src={player.photoURL} alt="player"/>}</td>
              <td>{player.firstName}</td>
              <td>{player.familyName}</td>
              <td>{player.nickName}</td>
              <td>{formatDate(player.dob)}</td>
              <td>{player.email}</td>
              <td>{player.phone}</td>
              <td>{formatDate(player.endedLastGame)}</td>
              <td>{player.isNormalRate?' ':isEn?'N':'לא'}</td>
              <td>{player.isCoach?isEn?'Y':'כן':' '}</td>
            </motion.tr>
          ))}
        </table>}
      </div>
    </div>
  )
}
