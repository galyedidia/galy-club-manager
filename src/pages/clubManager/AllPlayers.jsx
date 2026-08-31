import { useState } from "react"
import { useAuthContext } from "../../hooks/useAuthContext"
import { useCollection } from "../../hooks/useCollection"
import { useFirestore } from "../../hooks/useFirestore"
import editPlayer from '../../assets/editPlayer.png'
import { motion, AnimatePresence } from "framer-motion"
import DeletePlayerModal from "../../components/DeletePlayerModal"

export default function AllPlayers({ handleEditPlayer, isEn }) {

  const rowVar = {
    hidden: { opacity: 0, scale: 0.75 },
    visible: { opacity: 1, scale: 1 },
  }

  const [sortBy, setSortBy] = useState('FIRST-NAME')
  const [ascendSort, setAscendSort] = useState(false)
  const [playerToDelete, setPlayerToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  // Get User
  const { user } = useAuthContext()

  // Firestore update for inline rank change and deletion
  const { updateDocument: updatePlayerDoc, deleteDocument } = useFirestore('players')

  // Get Players 
  const { documents: allClubPlayersDocs } = useCollection(
    'players',
    ["clubId", "==", user.clubId],
    null,
    null
  )

  const formatDate = (firebaseDate) => {
    if (firebaseDate) {
      const date = new Date(firebaseDate.seconds * 1000)
      return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`
    } else {
      return ''
    }
  }

  const getSeconds = (firebaseDate) => {
    return firebaseDate ? firebaseDate.seconds : ''
  }

  const handleRankChange = async (playerId, newRank) => {
    await updatePlayerDoc(playerId, { rank: Number(newRank) })
  }

  const handleConfirmDelete = async () => {
    if (!playerToDelete) return
    setIsDeleting(true)
    setDeleteError(null)
    const targetId = playerToDelete.id

    // 1. Delete player document
    const res = await deleteDocument(targetId)

    if (res && res.success === false) {
      setIsDeleting(false)
      setDeleteError(res.error || (isEn ? 'Failed to delete player' : 'שגיאה במחיקת השחקן'))
      return
    }

    // 2. Clean up any restrictions on other players targeting this player
    if (allClubPlayersDocs) {
      for (const otherPlayer of allClubPlayersDocs) {
        if (otherPlayer.id !== targetId && otherPlayer.restrictions?.some((r) => r.targetPlayerId === targetId)) {
          const updated = otherPlayer.restrictions.filter((r) => r.targetPlayerId !== targetId)
          await updatePlayerDoc(otherPlayer.id, { restrictions: updated })
        }
      }
    }

    setIsDeleting(false)
    setPlayerToDelete(null)
  }

  // Sort Players
  const sortedPlayers = allClubPlayersDocs && allClubPlayersDocs.length > 0 ? [...allClubPlayersDocs].sort((a, b) => {
    let sort = 0
    if (sortBy === 'FIRST-NAME') { sort = (a.firstName.toLowerCase() > b.familyName.toLowerCase()) ? -1 : 1 }
    if (sortBy === 'FAMILY-NAME') { sort = (a.familyName.toLowerCase() > b.familyName.toLowerCase()) ? -1 : 1 }
    if (sortBy === 'RANK') { sort = ((Number(a.rank) || 3) > (Number(b.rank) || 3)) ? -1 : 1 }
    if (sortBy === 'DOB') { sort = (getSeconds(a.dob) > getSeconds(b.dob)) ? -1 : 1 }
    if (sortBy === 'LAST-SESSION') { sort = (getSeconds(a.endedLastGame) > getSeconds(b.endedLastGame)) ? -1 : 1 }
    if (sortBy === 'NORMAL-RATE') { sort = (a.isNormalRate > b.isNormalRate) ? -1 : 1 }
    if (sortBy === 'COACHES') { sort = (a.isCoach > b.isCoach) ? -1 : 1 }
    return ascendSort ? sort : -1 * sort
  }) : []

  const handleSort = (field) => {
    setSortBy((prev) => {
      if (prev === field) {
        setAscendSort((presAscend) => !presAscend)
      }
      return field
    })
  }

  const firstNameClassName = 'table-link' + (sortBy === 'FIRST-NAME' ? ' table-link-selected' : '')
  const familyNameClassName = 'table-link' + (sortBy === 'FAMILY-NAME' ? ' table-link-selected' : '')
  const rankClassName = 'table-link' + (sortBy === 'RANK' ? ' table-link-selected' : '')
  const dobClassName = 'table-link' + (sortBy === 'DOB' ? ' table-link-selected' : '')
  const lastSessionClassName = 'table-link' + (sortBy === 'LAST-SESSION' ? ' table-link-selected' : '')
  const normalRateClassName = 'table-link' + (sortBy === 'NORMAL-RATE' ? ' table-link-selected' : '')
  const coachesClassName = 'table-link' + (sortBy === 'COACHES' ? ' table-link-selected' : '')

  return (
    <div className="club-manager-table-container">
      <div className="club-manager-table-wrapper">
        {sortedPlayers && sortedPlayers.length > 0 &&
          <table>
            <thead>
              <tr className='club-manager-table-header'>
                <th style={{ width: '30px' }}> </th>
                <th style={{ width: '40px' }}> </th>
                <th className={firstNameClassName} onClick={() => handleSort('FIRST-NAME')}>{isEn ? 'First Name' : 'שם פרטי'}</th>
                <th className={familyNameClassName} onClick={() => handleSort('FAMILY-NAME')}>{isEn ? 'Family Name' : 'שם משפחה'}</th>
                <th>{isEn ? 'Nick Name' : 'כינוי'}</th>
                <th className={rankClassName} onClick={() => handleSort('RANK')}>{isEn ? 'Rank' : 'דירוג'}</th>
                <th className={dobClassName} onClick={() => handleSort('DOB')}>{isEn ? 'Birthday' : 'תאריך לידה'}</th>
                <th>{isEn ? 'E-mail' : 'אימייל'}</th>
                <th>{isEn ? 'Phone' : 'טלפון'}</th>
                <th className={lastSessionClassName} onClick={() => handleSort('LAST-SESSION')}>{isEn ? 'Last Session' : 'אימון אחרון'}</th>
                <th className={normalRateClassName} onClick={() => handleSort('NORMAL-RATE')}>{isEn ? 'Normal Rate' : 'עלות רגילה'}</th>
                <th className={coachesClassName} onClick={() => handleSort('COACHES')}>{isEn ? 'Coach' : 'מאמן'}</th>
                <th style={{ width: '30px' }}> </th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player, i) => (
                <motion.tr layout variants={rowVar} initial='hidden' animate='visible' transition={{ type: 'spring', delay: i * 0.05 }} key={player.id} className="club-manager-table-rows">
                  <td className="table-link" onClick={() => handleEditPlayer(player.id)} title={isEn ? 'Edit player' : 'ערוך שחקן'}>
                    <img src={editPlayer} alt="edit" />
                  </td>
                  <td>{player.photoURL && <img src={player.photoURL} alt="player" />}</td>
                  <td>
                    {player.firstName}
                    {player.restrictions && player.restrictions.length > 0 && (
                      <span
                        style={{ margin: '0 6px', cursor: 'pointer', fontSize: '0.85em' }}
                        title={isEn ? `${player.restrictions.length} matchmaking constraint(s)` : `${player.restrictions.length} אילוצי שיבוץ מוגדרים`}
                        onClick={() => handleEditPlayer(player.id)}
                      >
                        🚫
                      </span>
                    )}
                  </td>
                  <td>{player.familyName}</td>
                  <td>{player.nickName}</td>
                  <td>
                    <select
                      className="table-rank-select"
                      value={player.rank !== undefined && player.rank !== '' ? player.rank : 3}
                      onChange={(e) => handleRankChange(player.id, e.target.value)}
                    >
                      <option value={1}>1 - {isEn ? 'Beginner' : 'מתחיל'}</option>
                      <option value={2}>2 - {isEn ? 'Mid -' : 'אמצע -'}</option>
                      <option value={3}>3 - {isEn ? 'Mid +' : 'אמצע +'}</option>
                      <option value={4}>4 - {isEn ? 'Advanced' : 'מתקדם'}</option>
                      <option value={5}>5 - {isEn ? 'Elite' : 'תחרותי'}</option>
                    </select>
                  </td>
                  <td>{formatDate(player.dob)}</td>
                  <td>{player.email}</td>
                  <td>{player.phone}</td>
                  <td>{formatDate(player.endedLastGame)}</td>
                  <td>{player.isNormalRate ? ' ' : isEn ? 'N' : 'לא'}</td>
                  <td>{player.isCoach ? isEn ? 'Y' : 'כן' : ' '}</td>
                  <td className="table-link" onClick={() => setPlayerToDelete(player)} title={isEn ? 'Delete player' : 'מחק שחקן'}>
                    <svg
                      viewBox="0 0 24 24"
                      width="2.2vh"
                      height="2.2vh"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ cursor: 'pointer', verticalAlign: 'middle' }}
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {playerToDelete && (
          <DeletePlayerModal
            player={playerToDelete}
            onConfirm={handleConfirmDelete}
            onCancel={() => {
              setPlayerToDelete(null)
              setDeleteError(null)
            }}
            isDeleting={isDeleting}
            isEn={isEn}
            error={deleteError}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
