import { useEffect, useState } from "react"
import { useAuthContext } from "../../hooks/useAuthContext"
import { useCollection } from "../../hooks/useCollection"
import { useDocument } from "../../hooks/useDocument"
import { useFirestore } from "../../hooks/useFirestore"
import { motion } from 'framer-motion'
import Log from "../../components/LogUtil"

// Managing the Payments
// Every time payemnts page is open, all sessions that were not taken into account will be parsed and added to the payment records
//  then each session is marked as handeled
// Each Payment records shows the month, the total charged and total Paid, maybe total sessions? A button which shows all players and the amount.
// Each payment when pressed shows payment report - 
//  the payment report lists all players, the amount of sessions they attended, the dates, the amount they need to pay
//    and a toggle to indicate they payed. Another button to create a personal message with the amount, the dates - maybe an option to triger whatsup

export default function Payments ( { viewMonthlyPayment, isEn } ) {
  const rowVar = {
    hidden: {opacity:0, scale:0.5},
    visible: {opacity:1, scale:1},
  }
  // State to manage the adding of missing Payment entries
  const [last3MonthsEntriesAvailable, setLast3MonthsEntriesAvailable] = useState(false)
  // State to manage the adding of Session to Payments
  const [addingSessionsToPayments,setAddingSessionsToPayments] = useState('')

  // Get User
  const { user } = useAuthContext()
  // Get Club document
  const { document:clubDoc } = useDocument('clubs',user.clubId)
  // Get Sessions docuements that were not parsed + handle for Update
  const {updateDocument:updateSessionDoc} = useFirestore('sessions')
  const { documents:allSessionsDocs  } = useCollection (
    'sessions',
    ["clubId","==",user.clubId],
    ["parsedByPayments","==",false],
    null//["firstName","desc"]
  )
  // Filter and sort the sessions. Get only sessions that has games in it, and it is not active.
  const getSeconds = (firebaseDate) => firebaseDate ? firebaseDate.seconds : ''
  const filteredSessiosns = allSessionsDocs && allSessionsDocs.length>0 ? allSessionsDocs.filter((s)=>(s.doneGames.length>0) && !s.isActive):[]
  const sortedSessions = filteredSessiosns && filteredSessiosns.length>0 ? filteredSessiosns.sort((a,b) => {
    return (getSeconds(a.createdAt) > getSeconds(b.createdAt)) ? -1 : 1
  }): []

  // Get Players
  const { documents:allClubPlayersDocs } = useCollection (
    'players',
    ["clubId","==",user.clubId],
    null,
    null//["firstName","desc"]
  )
  // Get Three months array
  const generateThreeMonthsArray = () => {
    const _now = new Date()
    const _month = _now.getMonth()+1
    const _year = _now.getFullYear()
    const currentMonth = `${_month}-${_year}`
    const lastMonth = _month === 1 ? `12-${_year-1}` : `${_month-1}-${_year}`
    const twoMonthAgo = _month === 1 ? `11-${_year-1}` : _month === 2 ? `12-${_year-1}` : `${_month-2}-${_year}`
    return [twoMonthAgo,lastMonth,currentMonth]
  }
  const last3Months = generateThreeMonthsArray()
 
  // Get Payments list, and handle for update and handle for adding
  const {addDocument:addPaymentDoc,  updateDocument:updatePaymentDoc} = useFirestore('payments') 
  const { documents:allPayments } = useCollection (
    'payments',
    ["clubId","==",user.clubId],
    null,
    null//["firstName","desc"]
  )
  // Get All Payments, and make sure there are 3 months payments entries in DB
  useEffect( ()=> {
    Log('Payment','running useEffect for Payments adding last3MonthsEntriesAvailable:',last3MonthsEntriesAvailable)
    Log('Payment','running useEffect: allPayments',allPayments)
    if (last3MonthsEntriesAvailable) {
      return
    }
    async function addPayment (monthPayementEntry) {
      const payment = {
        month: monthPayementEntry,
        clubId: user.clubId,
        totalCharge: 0,
        totalPaid: 0,
        payers: [ ]
      }
      Log('Payment','adding payment',payment)
      await addPaymentDoc(payment)
    }
    let addEntries = []
    if (allPayments) {
      if (allPayments.length === 0) { // first entry for this club
        Log('Payment','payments are empty')
        addEntries = last3Months
      } else {
        last3Months.forEach((m)=> {
        if (allPayments.findIndex((payment)=>payment.month === m) === -1) {
            Log('Payment','payments do not have entry for month',m)
            addEntries.push(m)
          } else {
            Log('Payment','There is a monthly payment entry for ',m)
          }
        })
      }
      setLast3MonthsEntriesAvailable(true)
    }
    if (addEntries.length>0) {
      addEntries.forEach((m)=> {
        addPayment(m)
      })
    }
  },[allPayments,last3Months,addPaymentDoc,last3MonthsEntriesAvailable,user])

  const getMonthFromTimestamp = (firebaseDate) => {
    if (firebaseDate) {
      const date = new Date(firebaseDate.seconds*1000)
      return `${date.getMonth()+1}-${date.getFullYear()}`
    } else {
      return ''
    }
  }
  const getDateFromTimestamp = (firebaseDate) => {
    if (firebaseDate) {
      const date = new Date(firebaseDate.seconds*1000)
      return `${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}`
    } else {
      return ''
    }
  }
  // Get All players attended in a session - removing the coaches
  const getAllPlayersInSession = (session) => {
    const _allGames  = session.doneGames.flatMap((game)=>[...game.winTeam,...game.loseTeam])
    const _allPlayers = []
    _allGames.forEach((playerId)=>{
      const player = allClubPlayersDocs.find((cp)=> cp.id===playerId)
      if (!_allPlayers.includes(playerId) && !player.isCoach) {
        _allPlayers.push(playerId)
      }
    })
    return _allPlayers
  }

  //Calculate the total payments done for a payment
  const getTotalPaid = (payment) => {
    const paidPayers = payment.payers.filter((p)=> p.paid)
    let sum = 0
    paidPayers.forEach((payer)=>{
      sum +=payer.toCharge
    })
    return sum
  }
  // For Each Session
  // 1. Find the relevant monthly Payment Entry
  // 2. Find all the players in the session
  // 3. Update the Payment for each player in the session
  //   a. If not in the payment - add new element
  //   b. add the session date to the player
  //   c. update the amount to pay according to the number of sessions
  //   d. update the total amount of the payment
  // 4. Update the session as parsedByPayments = true and the Payment
  const addSessionToPayments = () => {
    setAddingSessionsToPayments('ADDING')

    sortedSessions.forEach( async (session) => {
      Log('Payment','Adding session to Payment ',session)
      const sessionDate = getDateFromTimestamp(session.createdAt)

      // 1. Find the relevant monthly Payment Entry
      const monthlyPayment = allPayments.find((payment) => payment.month === getMonthFromTimestamp(session.createdAt))
      Log('Payment','relevant monthly payment ',monthlyPayment)

      // 2. Find all the players in the session
      const playersInSession = getAllPlayersInSession(session)
      Log('Payment','players in session ',playersInSession)
      
      // 3. Update the Payment for each player in the session
      //   a. If not in the payment - add new element
      //   b. add the session date to the player
      const payers = monthlyPayment.payers
      playersInSession.forEach((playerId) => {
        let payerIndex = payers.findIndex(p=>p.playerId === playerId)
        if (payerIndex === -1) {
          payers.push({playerId,sessions:[sessionDate],sessionRate:0,maxMonthlyRate:0,toCharge:0,paid:false})
        } else {
          payers[payerIndex].sessions.push(sessionDate)
        }   
        //   c. update the amount to pay according to the number of sessions        
        const player = allClubPlayersDocs.find((cp)=> cp.id===playerId)
        payerIndex = payers.findIndex(p=>p.playerId === playerId)
        payers[payerIndex].sessionRate    = player.isNormalRate ? clubDoc.sessionRate    : player.sessionRate
        payers[payerIndex].maxMonthlyRate = player.isNormalRate ? clubDoc.maxMonthlyRate : player.maxMonthlyRate
        const pay = Math.min(payers[payerIndex].sessions.length * payers[payerIndex].sessionRate, payers[payerIndex].maxMonthlyRate)
        const payDelta = pay - payers[payerIndex].toCharge 
        payers[payerIndex].toCharge = pay
        
        //   d. update the total amount of the payment
        monthlyPayment.totalCharge += payDelta
        //console.log('Player:',player.firstName,' pay:',pay,' Delta:',payDelta,' total month:',monthlyPayment.totalCharge)  
      }) // for each player in session

      // 4. Update the session and update the payment
      //console.log('Updating payment id:',monthlyPayment.id,' total charge:',monthlyPayment.totalCharge,' payers:',[...monthlyPayment.payers])
      await updatePaymentDoc(monthlyPayment.id, {totalCharge: monthlyPayment.totalCharge, payers:[...monthlyPayment.payers]})
      await updateSessionDoc(session.id,{parsedByPayments:true})
    }) // for each session
    setAddingSessionsToPayments('DONE')
  }

  const paymentsList = allPayments && allClubPlayersDocs && sortedSessions && clubDoc ? allPayments : []
  const sortedPaymentsList = paymentsList.sort((a,b) => {
    const aArray = a.month.split('-')
    const aY = Number(aArray[1])
    const aM = Number(aArray[0])
    const bArray = b.month.split('-')
    const bY = Number(bArray[1])
    const bM = Number(bArray[0])
    if (aY > bY) {
      return -1
    } else if (aY < bY) {
      return 1
    } else {
      if (aM > bM) {
        return -1
      } else {
        return 1
      }
    }
  })
  Log('Payment',paymentsList)
  return (
    <div className="payments-container">
      <div className="payments-session-adding">
        {addingSessionsToPayments === '' && sortedSessions && sortedSessions.length > 0 && <div>
            <button onClick={addSessionToPayments} className="btn">{isEn?`Add ${sortedSessions.length} Sessions to Payments`:`הוסף את האימונים הבאים לתשלומים`}</button>
            {sortedSessions.map((session)=><li className="adding-session-list-item"><p>{getDateFromTimestamp(session.createdAt)}</p></li>)}
          </div>}
          {addingSessionsToPayments === 'ADDING' && <div><p>{isEn?'Adding Sessions to Payments...':'...אימונים מוספים לתשלום'}</p></div>}
          {addingSessionsToPayments === 'DONE' && <div><p>{isEn?'Done Adding Sessions':'אימונים הוספו לתשלום'}</p></div>}
      </div>
      <div className="club-manager-table-container">
        <div className="club-manager-table-wrapper">
        {sortedPaymentsList && sortedPaymentsList.length > 0 && 
          <table>         
            <motion.tr variants={rowVar} initial='hidden' animate='visible' transition={{type: 'spring',delay:0.1}} className='club-manager-table-header'>
              <th>{isEn?'Month':'חודש'}</th> 
              <th>{isEn?'Players':'שחקנים'}</th>
              <th>{isEn?'Total Charge':'סה"כ לתשלום'}</th> 
              <th>{isEn?'Total Paid':'סה"כ שולם'}</th>                                
            </motion.tr>
            {sortedPaymentsList.map((payment,i) => (
              <motion.tr variants={rowVar} initial='hidden' animate='visible' transition={{type: 'spring',delay: 0.2+i*0.1}} key={payment.month} className="club-manager-table-rows">
                <td className="table-link" onClick={()=> viewMonthlyPayment(payment.id)}>{payment.month}</td>
                <td>{payment.payers.length}</td>
                <td>{payment.totalCharge}</td>
                <td>{getTotalPaid(payment)}</td>
              </motion.tr>
            ))}
          </table>}
        </div>
      </div>
    </div>
  )
}
