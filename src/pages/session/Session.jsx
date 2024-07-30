import { useAuthContext } from "../../hooks/useAuthContext"
import { useCollection } from "../../hooks/useCollection"
import { useFirestore } from '../../hooks/useFirestore';
import ActiveSession from './ActiveSession';
import { useDocument } from "../../hooks/useDocument";
import Log from "../../components/LogUtil";
import SessionReport from "../clubManager/SessionReport";

const initialCourts = [
  {
    id:0,
    aTeam:[],
    bTeam:[],
    gameOn: false,
    startedAt:'',
    waitingCourt: false
  },
  {
    id:1,
    aTeam:[],
    bTeam:[],
    gameOn: false,
    startedAt:'',
    waitingCourt: false
  },
  {
    id:2,
    aTeam:[],
    bTeam:[],
    gameOn: false,
    startedAt:'',
    waitingCourt: false
  },
  {
    id:3,
    aTeam:[],
    bTeam:[],
    gameOn: false,
    startedAt:'',
    waitingCourt: false
  },
  {
    id:4,
    aTeam:[],
    bTeam:[],
    gameOn: false,
    startedAt:'',
    waitingCourt: true,
    waitingIndex: 0
  }
]

export default function Session() {
  
  // Get User
  const { user } = useAuthContext()
  // Get Club document
  const { document: clubDoc } = useDocument('clubs',user.clubId)
  const isEn = () => clubDoc.lang==='Eng'
  
  // Get Active Session
  const {documents, error} = useCollection (
    'sessions',
    ["clubId","==",user.clubId],
    ["isActive","==",true],
    null//["firstName","desc"]
  )
  const activeSession = !documents ? null : documents.length > 0 ? documents[0] : undefined
  Log('session',"activeSession",activeSession)

  // Get Sessions - to present the last session statistics
  const { documents:allSessions  } = useCollection (
    'sessions',
    ["clubId","==",user.clubId],
    null,
    null//["firstName","desc"]
  )

  // Filter and sort the sessions
  const getSeconds = (firebaseDate) => firebaseDate ? firebaseDate.seconds : ''
  const filteredSessiosns = allSessions && allSessions.length>0 ? allSessions.filter((s)=>s.doneGames.length>0):[]
  const sortedSessions = filteredSessiosns && filteredSessiosns.length>0 ? filteredSessiosns.sort((a,b) => {
    return (getSeconds(a.createdAt) > getSeconds(b.createdAt)) ? -1 : 1
  }): []
  const lastSession = sortedSessions.length>0 ? sortedSessions[0] : null

  // Firestore Hook for Sessions to add a new
  const {addDocument} = useFirestore('sessions')

  // Add new Active Session
  const handleStartSession = async () => {
    const newSession = {
      clubId: user.clubId,
      isActive: true,
      doneGames: [],
      courts: initialCourts,
      parsedByPayments: false,
      mouseOrTouch: 'mouse'
    }
    Log('session','newSession', newSession)
    await addDocument(newSession)
  }

  // Return different messages depending on the activeSession
  if (activeSession === null) {
    return (
      <div>
        <h2>Loading...</h2>
        {error && <div className='error'>{error}</div>}
      </div>
    )
  } else if (activeSession === undefined) {
    return (
      <>
        {clubDoc && <div className="no-active-session" style={{direction:isEn()?'ltr':'rtl'}}>
          <span className="no-active-session-message" >
            <h2>{isEn()?'No Active Session Yet...':'אין אימון פעיל כרגע...'}</h2>
            {user.isCoach && <button className="btn" onClick={handleStartSession}>{isEn()?'!!! Start a Session !!!':'!!! התחל אימון !!!'}</button>}
          </span>
          {error && <div className='error'>{error}</div>}
          {lastSession && <div className="no-active-session-session-report-container">
            <h3 style={isEn()?{marginRight:'10vw'}:{marginLeft:'10vw'}}>{isEn()?'Last Session Stats':'סטיסטיקות האימון האחרון'}</h3>
            <SessionReport session={lastSession} isEn={isEn()} lastGameStat={true}/>
          </div>}
        </div>}
      </>
    )
  }

  //backend={HTML5Backend}
  return (
    <div className="session-container">
        {clubDoc && <ActiveSession sessionId={activeSession.id} isEn={isEn()} />}
     </div>
  )
}
