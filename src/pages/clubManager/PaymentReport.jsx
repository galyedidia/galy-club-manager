import { useAuthContext } from "../../hooks/useAuthContext"
import { useCollection } from "../../hooks/useCollection"
import { useDocument } from "../../hooks/useDocument"
import { useFirestore } from "../../hooks/useFirestore"
import sms from '../../assets/sms.png'


export default function PaymentReport( {paymentId, isEn, payMsgIsEn} ) {
  // const rowVar = {
  //   hidden: {opacity:0, scale:0.5},
  //   visible: {opacity:1, scale:1},
  // }

  // Get User
  const { user } = useAuthContext()

  // Get Players 
  const { documents:allClubPlayersDocs } = useCollection (
    'players',
    ["clubId","==",user.clubId],
    null,
    null//["firstName","desc"]
  )
  
  // Get Payment and handle for update
  const { document:paymentDoc } = useDocument('payments',paymentId)
  const { updateDocument:updatePaymentDoc} = useFirestore('payments') 
  
  const sortedPayers = paymentDoc ? paymentDoc.payers.sort((a,b)=> {
    const playerA = allClubPlayersDocs.find((cp)=> cp.id===a.playerId)
    const playerB = allClubPlayersDocs.find((cp)=> cp.id===b.playerId)
    if (a.paid && !b.paid) {
      return 1
    } else if (!a.paid && b.paid) {
      return -1
    } else if (playerA.isNormalRate && !playerB.isNormalRate) {
      return -1 
    } else if (!playerA.isNormalRate && playerB.isNormalRate) {
      return 1
    } else if (playerA.familyName < playerB.familyName) {
      return -1
    } else {
      return 1
    }
  }): []

  const sessionsDatesString = (payer) => {
    const sessionDates = payer.sessions.map((s) => (s.split('-')[0])).sort()
    let str = ''
    sessionDates.forEach((d, index) => {
      if (index === 0) {
        str = d
      } else {
        str += `, ${d}`
      }
    })
    return str
  }

  const togglePayment = async (playerId) => {
    const payerIndex = paymentDoc.payers.findIndex(p=>p.playerId === playerId)
    paymentDoc.payers[payerIndex].paid = !paymentDoc.payers[payerIndex].paid
    await updatePaymentDoc(paymentId, {payers: [...paymentDoc.payers]})
  }
  const paymentMessage = (playerId) => {
    const payerIndex = paymentDoc.payers.findIndex(p=>p.playerId === playerId)
    const payer = paymentDoc.payers[payerIndex]
    const player = allClubPlayersDocs.find((cp)=> cp.id===playerId)
    let message = ''
    if (payMsgIsEn) {
      message = `Hi ${player.firstName}, %0a`
      message += `You played ${payer.sessions.length} time${payer.sessions.length>1?'s':''} in ${paymentDoc.month} %0a`
      message += `Session${payer.sessions.length>1?'s':''} Day${payer.sessions.length>1?'s':''}: ${sessionsDatesString(payer)} %0a`  
      message += `Your charge is: ${payer.toCharge} NIS %0a`
      message += `See you in the club...`
    } else {
      message = `שלום ${player.firstName}, %0a`
      message += `שיחקת ${payer.sessions.length} פעמים בחודש ${paymentDoc.month} %0a `
      message += `הימים בהם שחקת הינם ${sessionsDatesString(payer)} %0a`
      message += `החיוב החודשי שלך הינו: ש"ח ${payer.toCharge} %0a`
      message += `נתראה במועדון...`
    }
    return message
  }
  return (
    <div className="payment-report">
      <div className="club-manager-table-container">
        <div className="club-manager-table-wrapper">
        {paymentDoc &&
          <table>         
            {/* <motion.tr variants={rowVar} initial='hidden' animate='visible' transition={{type: 'spring',delay:0.1}} className='club-manager-table-header'> */}
            <tr className='club-manager-table-header'>
              <th>{paymentDoc.month} </th> 
              <th>{isEn?' Charge ':' לתשלום '}</th> 
              <th>{isEn?' Normal Rate ':' עלות רגילה '}</th>
              <th>{isEn?'   Paid   ':'   שולם   '}</th>            
              <th>{isEn?' # Sessions ':' # אימונים'}</th>            
              <th>{isEn?' Sessions Dates ':' תאריכי האימונים'}</th>          
              <th>{isEn?' Message ':' שלח הודעה '}</th>    
            </tr>
            {sortedPayers.map((payer,i) => {
              const player = allClubPlayersDocs.find((cp)=> cp.id===payer.playerId)
              return (
              // <motion.tr layout variants={rowVar} initial='hidden' animate='visible' transition={{type: 'spring',delay: i*0.03}} key={player.id} className="club-manager-table-rows">
              <tr  key={player.id} className="club-manager-table-rows">
                <td>{player.firstName} {player.familyName}</td>
                <td>{payer.toCharge}</td>
                <td>{player.isNormalRate ? 'Yes':'No'}</td>
                <td className="table-link" onClick={()=> togglePayment(player.id)}>{payer.paid ? 'Yes' : 'No'}</td>
                <td>{payer.sessions.length}</td>
                <td>{sessionsDatesString(payer)}</td>
                <td className="table-link"><a target="_blank" rel="noreferrer" href={`https://wa.me/${player.phone}?text=${paymentMessage(player.id)}`}>
                    <img className="table-icon" src={sms} alt="sms"/>
                  </a>
                </td>
              </tr>)
            })}
          </table>}
        </div>
      </div>
    </div>
  )
}


