import { useState } from "react"

import { useAuthContext } from "../../hooks/useAuthContext"
import { useCollection } from "../../hooks/useCollection"
import { useDocument } from "../../hooks/useDocument"
import { useFirestore } from "../../hooks/useFirestore"
import { timestamp } from "../../firebase/config"

import AllCourts from "./AllCourts"
import WaitingPlayers from "./WaitingPlayers"
import Coaches from "./Coaches"
import ExitSession from "./ExitSession"
import AddPlayersModal from "./AddPlayersModal"
import ScoreBoard from "./ScoreBoard"
import ScoreboardModal from "./ScoreboardModal"
import EndSessionErrorModal from "./EndSessionErrorModal"
import EndSessionConfirmModal from "./EndSessionConfirmModal"
import DoneGamesModal from "./DoneGamesModal"

import { calculateScoreBoard } from "./ScoreBoardUtil"

import addPlayersImg from '../../assets/add-players-pink.png'
import endSessionImg from '../../assets/end-session.png'
import mouseImg      from '../../assets/mouse.png'
import touchImg      from '../../assets/touch.png'

import { motion, AnimatePresence } from "framer-motion"
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from 'react-dnd-touch-backend';
import Log from "../../components/LogUtil"

export default function ActiveSession({ sessionId, isEn }) {
  
  /*
  Fields in the session stored in firebase
  - players - All players attending the active session - array of objects - each has player Id and if left the session
  - courts - array of courts, each game has
    - id - the court id 
    - aTeam - list of player IDs
    - bTeam - list of player IDs
    - startTime
    - gameOn - indicate if the game is running
    - waitingCourt - is it the waiting court

  - doneGames - array of games, each game has
    - winTeam - list of player IDs
    - loseTeam - list of player IDs
    - startTime & endTime
    - courtNumber

  Aiding lists
  - allClubPlayersDocs - snapshot from firbase that holds all club players with all thier data
  - playersAtSession - array of player Ids which attends the session
  - playersNotAtSession - array of player objects which do not attend the session

  - courts - state which holds the players and start time for each court

  */

  // States
  const [showAddPlayersModal, setShowAddPlayersModal] = useState(false)
  const [showScoreboardModal, setShowScoreboardModal] = useState(false)
  const [showDoneGamesModal, setShowDoneGamesModal] = useState(null)
  const [endSessionModal, setEndSessionModal] = useState('NONE')
  const [touch, setTouch] = useState(!!localStorage.getItem('touch'))

  // Get Active Session
  const {document: activeSessionDoc} = useDocument('sessions',sessionId)
  Log ('activeSession',"activeSessionDoc",activeSessionDoc)

  // Hook for firestore to update Active Session
  const {updateDocument: updateSessionDocument } = useFirestore('sessions')
 
  // Hook for firestore to update Players
  const {updateDocument: updatePlayerDocument } = useFirestore('players')

  // Get All Club Players
  const { user } = useAuthContext()
  const { documents: allClubPlayersDocs } = useCollection (
    'players',
    ["clubId","==",user.clubId],
    null,
    null//["firstName","desc"]
  )
  
  // Get Hide Scoreboard indication
  const { document: clubDoc } = useDocument('clubs',user.clubId)
  const hideScoreboard = clubDoc ? clubDoc.hideScoreboard : false

  // Players at the session and players not in session
  const playersAtSession    = allClubPlayersDocs ? allClubPlayersDocs.filter((p)=> p.inSession) : []
  const playersNotAtSession = allClubPlayersDocs ? allClubPlayersDocs.filter((p)=>!p.inSession) : []
  Log ('activeSession',"allClubPlayersDocs" ,allClubPlayersDocs)
  Log ('activeSession',"playersAtSession"   ,playersAtSession)
  Log ('activeSession',"playersNotAtSession",playersNotAtSession)

  // Waiting players - players (not coaches) which are in the session but not in courts
  // construct aiding list of players in Court, then filter out
  const _playersInCourts = activeSessionDoc ? activeSessionDoc.courts.flatMap((c) => [...c.aTeam,...c.bTeam]) : []
  Log ('activeSession',"_playersInCourt",_playersInCourts)
  const waitingPlayers = allClubPlayersDocs ? playersAtSession.filter((player)=>!_playersInCourts.includes(player.id) && !player.isCoach) : []
  Log ('activeSession',"waitingPlayers",waitingPlayers)

  //Number of waiting courts is dynamic
  const numWaitingCourts = activeSessionDoc ? activeSessionDoc.courts.filter((c)=>c.waitingCourt).length : 0

  // Coaches at session are players at session that are coach. Update if Coach is in Court
  const coachesAtSession = allClubPlayersDocs ? playersAtSession.filter((p)=>p.isCoach) : []
  coachesAtSession.forEach((c) => c.coachInCourt = _playersInCourts.includes(c.id)) 

  // Scoreboard  
  const scoreBoard = activeSessionDoc ? calculateScoreBoard(activeSessionDoc) : null
  console.log(scoreBoard)

  // A function to remove a player from all courts. 
  // DB update is called by the calling functions
  const removePlayerFromCourts = (playerId) => {
    activeSessionDoc.courts.forEach((c)=> {
      c.aTeam = c.aTeam.filter((p)=>p!==playerId)
      c.bTeam = c.bTeam.filter((p)=>p!==playerId)
    })
  }
  
  // Update players DB that it is in the session
  const handleAddPlayer = async (playerId) => {
    await updatePlayerDocument(playerId,{inSession: true,gamesInSession: 0, endedLastGame:timestamp.fromDate(new Date())})
  }

  // 1. Remove player from Any Court it might be present
  // 2. Update players DB that it is in not in the session
  // 3. Update courts DB
  const handlePlayerLeftSession = async (playerId) => {
    // 1. 
    removePlayerFromCourts(playerId)

    // 2.
    await updatePlayerDocument(playerId,{inSession: false,coachInCourt: false})

    // 3.
    await updateSessionDocument(activeSessionDoc.id,{courts: [...activeSessionDoc.courts]})
  }

  // This function is triggered by the HalfCourt when a player is dropped (added)
  // 1. The player is removed from any court it may exist
  // 2. then it is added to the half court
  // 3. then update DB
  const addPlayerToCourt = async (playerId, court, aTeamSide) => {
    Log ('activeSession',"addPlayerToCourt",activeSessionDoc)
    // 1. 
    removePlayerFromCourts(playerId)

    // 2. 
    if (aTeamSide) {
      activeSessionDoc.courts[court.id].aTeam.push(playerId)
    } else {
      activeSessionDoc.courts[court.id].bTeam.push(playerId)
    }

    // 3.
    await updateSessionDocument(activeSessionDoc.id,{courts: [...activeSessionDoc.courts]})
  }

  // 1. move the teams from the right waiting court to the relevant court
  // 2. empty the relevant waiting court
  // 3. TODO - If waitingIndex=0 and there is a waitingIndex=1 and there is any player there - move it to index=0 
  // 4. update DB
  const addWaitingCourtPlayersToCourt = async (court,waitingCourtId) => {
     // 1.
     activeSessionDoc.courts[court.id].aTeam=activeSessionDoc.courts[waitingCourtId].aTeam
     activeSessionDoc.courts[court.id].bTeam=activeSessionDoc.courts[waitingCourtId].bTeam
     // 2.
     activeSessionDoc.courts[waitingCourtId].aTeam = []
     activeSessionDoc.courts[waitingCourtId].bTeam = []
    // 3.
    if (activeSessionDoc.courts[waitingCourtId].waitingIndex === 0 && numWaitingCourts > 1) {
      activeSessionDoc.courts[waitingCourtId].aTeam = activeSessionDoc.courts[waitingCourtId+1].aTeam
      activeSessionDoc.courts[waitingCourtId].bTeam = activeSessionDoc.courts[waitingCourtId+1].bTeam
      activeSessionDoc.courts[waitingCourtId+1].aTeam = []
      activeSessionDoc.courts[waitingCourtId+1].bTeam = []
     }
    // 4.
    await updateSessionDocument(activeSessionDoc.id,{courts: [...activeSessionDoc.courts]})
  }

  // 1. Update the court state
  // 2. update DB
  const startGame = async (courtId) => {

    // 1.
    activeSessionDoc.courts[courtId].gameOn = true
    activeSessionDoc.courts[courtId].startTime = timestamp.fromDate(new Date())

    // 2.
    await updateSessionDocument(activeSessionDoc.id,{courts: [...activeSessionDoc.courts]})
  }

  // 1. Create done game 
  // 2. Remove the players from the court
  // 3. Update the Session DB with new done game, and court being freed
  // 4. Update each player with the number of sessions + end time of the game
  const endGame = async (winTeam,courtId) => {
    Log ('activeSession',"endGame winTeam",winTeam)
    Log ('activeSession',"endGame courtId",courtId)
    console.log('endGame court:',courtId," win Team: ",winTeam)
    const _allPlayers = [...activeSessionDoc.courts[courtId].aTeam,...activeSessionDoc.courts[courtId].bTeam]
    // 1.
    const doneGame = {
      courtNumber: courtId,
      winTeam:  winTeam ==='aWin' ? activeSessionDoc.courts[courtId].aTeam : activeSessionDoc.courts[courtId].bTeam,
      loseTeam: winTeam ==='aWin' ? activeSessionDoc.courts[courtId].bTeam : activeSessionDoc.courts[courtId].aTeam,
      startTime: activeSessionDoc.courts[courtId].startTime,
      endTime: timestamp.fromDate(new Date())
    }
    // 2.
    activeSessionDoc.courts[courtId].aTeam = []
    activeSessionDoc.courts[courtId].bTeam = []
    activeSessionDoc.courts[courtId].gameOn = false
    activeSessionDoc.courts[courtId].startTime = ''

    // 3.
    Log ('activeSession',"endGame endGames before adding",activeSessionDoc.doneGames)
    activeSessionDoc.doneGames.push(doneGame)
    await updateSessionDocument(activeSessionDoc.id,{
      doneGames: [...activeSessionDoc.doneGames],
      courts: [...activeSessionDoc.courts]
    })
    Log ('activeSession',"endGame endGames after adding",activeSessionDoc.doneGames)
    
    //4. 
    const endedLastGame = timestamp.fromDate(new Date())
    _allPlayers.forEach(async (playerId)=> {
      let preGamesInSession = allClubPlayersDocs.filter((player)=>player.id===playerId)[0].gamesInSession
      if (preGamesInSession === null || preGamesInSession === undefined) {
        preGamesInSession = 0
      }
      await updatePlayerDocument(playerId,{gamesInSession: preGamesInSession+1, endedLastGame})
    })
  }
  
  // This is triggered when a player is dragged to the waiting queue
  // to handle this, it is only needed to remove it from the court
  const handleDropBackToWaiting = async (playerId) => {
    removePlayerFromCourts(playerId)
    await updateSessionDocument(activeSessionDoc.id,{courts: [...activeSessionDoc.courts]})
  }

  const confirmEndSession = () => {
    if (activeSessionDoc.courts.some((c)=>c.gameOn)) {
      setEndSessionModal('END_SESSION_ERROR')
    } else {
      setEndSessionModal('END_SESSION_CONFIRM')  
    }
  }
  
  const endSession = async () => {
    playersAtSession.forEach(async (player) => {
      await updatePlayerDocument(player.id,{inSession: false, coachInCourt: false})
    })
    const coaches = coachesAtSession.map((c) => (c.id) )
    await updateSessionDocument(activeSessionDoc.id,{isActive: false,coaches})
  }

  const showScoreboard = () => {
    setShowScoreboardModal(true)
  }
  const doneShowScoreboard = () => {
    setShowScoreboardModal(false)
  }
  // This function toggeles the backend of the DND
  // The page has to reload, so it is saved in the active session
  const switchMouseTouch = async () => {
    if (touch) {
      localStorage.removeItem('touch')
      setTouch(false)
    } else {
      localStorage.setItem('touch','touch')
      setTouch(true)
    }
    window.location.reload()
  }

  // Add Waiting Court
  const addWaitingCourt = async () => {
    const newCourt = {
      id: activeSessionDoc.courts.length,
      aTeam:[],
      bTeam:[],
      gameOn: false,
      startedAt:'',
      waitingCourt: true,
      waitingIndex: activeSessionDoc.courts[activeSessionDoc.courts.length-1].waitingIndex+1
    }
    activeSessionDoc.courts.push(newCourt)
    await updateSessionDocument(activeSessionDoc.id,{courts: [...activeSessionDoc.courts]})
  }

  const removeWaitingCourt = async () => {
    activeSessionDoc.courts.pop()
    await updateSessionDocument(activeSessionDoc.id,{courts: [...activeSessionDoc.courts]})
  }

  const handlePlayerClick = (playerId) => {
    setShowDoneGamesModal(playerId)
  }
  return (
    <>
      {activeSessionDoc && <DndProvider backend={!touch ? HTML5Backend : TouchBackend}> 
        <motion.div className="active-session-container">
          <AnimatePresence>
            {showAddPlayersModal && 
              <AddPlayersModal  handleAddPlayer={handleAddPlayer} 
                                playersNotAtSession={playersNotAtSession}
                                done={()=> setShowAddPlayersModal(false)} isEn={isEn}/>}
            {showScoreboardModal && 
              <ScoreboardModal allClubPlayersDocs={allClubPlayersDocs} done={doneShowScoreboard} scoreboard={scoreBoard} maxShow={10} isEn={isEn}/>
            }
            {endSessionModal === 'END_SESSION_ERROR' && <EndSessionErrorModal done={() => setEndSessionModal('NONE')} isEn={isEn}/>}
            {endSessionModal === 'END_SESSION_CONFIRM' && <EndSessionConfirmModal cancel={() => setEndSessionModal('NONE')} ok={endSession} isEn={isEn}/>}
            {showDoneGamesModal && <DoneGamesModal allClubPlayersDocs={allClubPlayersDocs} done={()=>setShowDoneGamesModal(null)} isEn={isEn} 
                                                   playerId={showDoneGamesModal} session={activeSessionDoc}/>}
          </AnimatePresence>
          <div className="all-courts">
            {allClubPlayersDocs && <AllCourts allClubPlayersDocs={allClubPlayersDocs} courts={activeSessionDoc.courts} startGame={startGame} 
                endGame={endGame}
                addPlayerToCourt={addPlayerToCourt}
                addWaitingCourtPlayersToCourt={addWaitingCourtPlayersToCourt}
                isEn={isEn} viewer={!user.isCoach} addWaitingCourt={addWaitingCourt} numWaitingCourts={numWaitingCourts}
                removeWaitingCourt={removeWaitingCourt} handlePlayerClick={handlePlayerClick}/>}
            <div className="side-bar-container">
              <Coaches coachesAtSession={coachesAtSession} handleDropBackToWaiting={handleDropBackToWaiting} isEn={isEn} viewer={!user.isCoach} handlePlayerClick={handlePlayerClick}/>
              {user.isCoach && <button className="add-players-btn" onClick={()=>setShowAddPlayersModal(true)}>
                <img src={addPlayersImg} alt="add-players"/>
              </button>}
              {!hideScoreboard && <ScoreBoard allClubPlayersDocs={allClubPlayersDocs} scoreBoard={scoreBoard} maxShow={user.isCoach?3:10} clickOnScoreboard={showScoreboard} isEn={isEn} />}
              {hideScoreboard && <div><p className="no-scores-yet"> </p></div>}
              {user.isCoach && <ExitSession handleExitSession={handlePlayerLeftSession} isEn={isEn}/>}
              {user.isCoach && <button className="mouse-touch-btn" onClick={switchMouseTouch} >
                <img src={!touch?mouseImg:touchImg} alt="end session"/>
              </button>}
              {user.isCoach && <button className="end-session-btn" onClick={confirmEndSession} >
                <img src={endSessionImg} alt="end session"/>
              </button>}
            </div>
          </div>
          <WaitingPlayers 
            waitingPlayers={waitingPlayers} 
            handleDropBackToWaiting={handleDropBackToWaiting}
            isEn={isEn} viewer={!user.isCoach} handlePlayerClick={handlePlayerClick}
            />
        </motion.div>
      </DndProvider>}
    </>
  )
}
