import { useAuthContext } from "../../hooks/useAuthContext"
import { useCollection } from "../../hooks/useCollection"
import { motion } from 'framer-motion'

export default function Sessions( {viewSession, isEn}) {
  const rowVar = {
    hidden: {opacity:0, scale:0.5},
    visible: {opacity:1, scale:1},
  }  
  
  // Get User
  const { user } = useAuthContext()

  // Get Sessions 
  const { documents:allSessions  } = useCollection (
    'sessions',
    ["clubId","==",user.clubId],
    null,
    null//["firstName","desc"]
  )
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
  
  const getSeconds = (firebaseDate) => firebaseDate ? firebaseDate.seconds : ''

  const getNumberOfPlayers = (session) => {
    const _allGames  = session.doneGames.flatMap((game)=>[...game.winTeam,...game.loseTeam])
    const _allPlayers = []
    _allGames.forEach((playerId)=>{
      if (!_allPlayers.includes(playerId)) {
        _allPlayers.push(playerId)
      }
    })
    return _allPlayers.length
  }
  const getCoaches = (session) => {
    if (session.coaches) {
      let coachesString = ''
      session.coaches.forEach((coachId,index) => {
        const coach = allClubPlayersDocs.find((cp)=> cp.id===coachId)
        coachesString += index > 0 ? ' - ': ''
        coachesString += coach.firstName
      });
      return coachesString
    }
    return isEn?'No Data':'אין מידע'
  }
  // Filter and sort the sessions
  const filteredSessiosns = allSessions && allSessions.length>0 ? allSessions.filter((s)=>s.doneGames.length>0):[]
  const sortedSessions = filteredSessiosns && filteredSessiosns.length>0 ? filteredSessiosns.sort((a,b) => {
    return (getSeconds(a.createdAt) > getSeconds(b.createdAt)) ? -1 : 1
  }): []

  return (
    <div className="club-manager-table-container">
      <div className="club-manager-table-wrapper">
      {sortedSessions && sortedSessions.length > 0 && allClubPlayersDocs &&
        <table>         
          <motion.tr variants={rowVar} initial='hidden' animate='visible' transition={{type: 'spring',delay:0.1}} className='club-manager-table-header'>
            <th>{isEn?'  Date  ':'  תאריך  '}</th> 
            <th>{isEn?'  Coaches  ':'  מאמנים  '  }</th> 
            <th>{isEn?'  # Players  ':'  # שחקנים  '}</th>            
            <th>{isEn?'  # Games  ':'  # משחקים  '}</th>                     
          </motion.tr>
          {sortedSessions.map((session,i) => (
            <motion.tr variants={rowVar} initial='hidden' animate='visible' transition={{type: 'spring',delay: 0.1+i*0.03}} key={session.id} className="club-manager-table-rows">
              <td className="table-link" onClick={()=> viewSession(session)}>{formatDate(session.createdAt)}</td>
              <td>{getCoaches(session)}</td>
              <td>{getNumberOfPlayers(session)}</td>
              <td>{session.doneGames.length}</td>
            </motion.tr>
          ))}
        </table>}
      </div>
    </div>

  )
}
