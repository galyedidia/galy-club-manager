import { useState, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAuthContext } from '../../hooks/useAuthContext'
import { useCollection } from '../../hooks/useCollection'
import { useFirestore } from '../../hooks/useFirestore'
import { CONSTRAINT_LEVELS, normalizeConstraint } from '../../utils/matchmaking'
import PlayerRestrictionsModal from './PlayerRestrictionsModal'
import birdie from '../../assets/birdie.jpg'
import editPlayerImg from '../../assets/editPlayer.png'

export default function MatchmakingRules({ isEn }) {
  const { user } = useAuthContext()
  const { updateDocument } = useFirestore('players')

  const { documents: allClubPlayersDocs, isPending } = useCollection(
    'players',
    user?.clubId ? ['clubId', '==', user.clubId] : null,
    null,
    null
  )

  const [selectedPlayerForModal, setSelectedPlayerForModal] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Extract all club rules across all players
  const allClubRules = useMemo(() => {
    if (!allClubPlayersDocs) return []

    const rules = []

    allClubPlayersDocs.forEach((p1) => {
      const restrictions = p1.restrictions || []
      restrictions.forEach((rRaw) => {
        const r = normalizeConstraint(rRaw)
        const p2 = allClubPlayersDocs.find((p) => p.id === r.targetPlayerId)

        rules.push({
          id: `${p1.id}_${r.targetPlayerId}`,
          sourcePlayer: p1,
          targetPlayer: p2,
          targetPlayerId: r.targetPlayerId,
          partnerRule: r.partnerRule,
          courtRule: r.courtRule,
          notes: r.notes,
          updatedAt: r.updatedAt
        })
      })
    })

    return rules
  }, [allClubPlayersDocs])

  const handleDeleteRule = async (sourcePlayerId, targetPlayerId) => {
    setIsDeleting(true)
    const p1 = allClubPlayersDocs.find((p) => p.id === sourcePlayerId)
    if (p1) {
      const updated = (p1.restrictions || []).filter((r) => r.targetPlayerId !== targetPlayerId)
      await updateDocument(sourcePlayerId, { restrictions: updated })
    }
    setIsDeleting(false)
  }

  const renderRuleBadge = (type, rule) => {
    if (rule === CONSTRAINT_LEVELS.NONE || !rule) return '-'
    if (type === 'partner') {
      if (rule === CONSTRAINT_LEVELS.PREFER) {
        return <span className="rules-badge badge-prefer-partner">{isEn ? '⭐ Preferred Partner' : '⭐ רצוי כבן זוג'}</span>
      }
      if (rule === CONSTRAINT_LEVELS.FORBIDDEN) {
        return <span className="rules-badge badge-forbidden-partner">{isEn ? '🚫 Forbidden Partner' : '🚫 אסור כבן זוג'}</span>
      }
      if (rule === CONSTRAINT_LEVELS.AVOID) {
        return <span className="rules-badge badge-avoid-partner">{isEn ? '⚠️ Avoid Partner' : '⚠️ רצוי שלא כבן זוג'}</span>
      }
    }
    if (type === 'court') {
      if (rule === CONSTRAINT_LEVELS.FORBIDDEN) {
        return <span className="rules-badge badge-forbidden-court">{isEn ? '⛔ Forbidden Court' : '⛔ אסור במגרש'}</span>
      }
      if (rule === CONSTRAINT_LEVELS.AVOID) {
        return <span className="rules-badge badge-avoid-court">{isEn ? '🚷 Avoid Court' : '🚷 רצוי שלא במגרש'}</span>
      }
    }
    return '-'
  }

  return (
    <div className="club-manager-table-container" style={{ width: '100%', height: '80vh', overflow: 'hidden' }}>
      <div className="club-manager-table-wrapper" style={{ overflowY: 'auto', height: '100%' }}>
        {isPending ? (
          <div style={{ padding: '5vh', textAlign: 'center', color: 'var(--text-color)', fontSize: '2vh' }}>
            {isEn ? 'Loading constraints...' : 'טוען אילוצים...'}
          </div>
        ) : allClubRules.length === 0 ? (
          <div style={{ padding: '8vh 2vw', textAlign: 'center', color: 'var(--text-color)' }}>
            <div style={{ fontSize: '4vh', marginBottom: '1vh' }}>🤝</div>
            <h3 style={{ color: 'var(--heading-color)', fontSize: '2.4vh', margin: '0 0 1vh 0' }}>
              {isEn ? 'No Constraints Defined' : 'לא הוגדרו אילוצי שיבוץ'}
            </h3>
            <p style={{ fontSize: '1.8vh' }}>
              {isEn
                ? 'No matchmaking constraints defined yet. You can set them from the player profile.'
                : 'לא הוגדרו עדיין אילוצים בין שחקני המועדון. ניתן להגדיר אילוצים במסך עריכת שחקן.'}
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
            <colgroup>
              <col style={{ width: '25%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '8%' }} />
            </colgroup>
            <thead>
              <tr className="club-manager-table-header">
                <th style={{ textAlign: 'center', padding: '1.2vh 0.5vw' }}>{isEn ? 'Player 1' : 'שחקן 1'}</th>
                <th style={{ textAlign: 'center', padding: '1.2vh 0.5vw' }}>{isEn ? 'Player 2' : 'שחקן 2'}</th>
                <th style={{ textAlign: 'center', padding: '1.2vh 0.5vw' }}>{isEn ? 'Partner Rule' : 'יחס כבני זוג'}</th>
                <th style={{ textAlign: 'center', padding: '1.2vh 0.5vw' }}>{isEn ? 'Court Rule' : 'יחס על אותו מגרש'}</th>
                <th style={{ textAlign: 'center', padding: '1.2vh 0.5vw' }}>{isEn ? 'Action' : 'פעולה'}</th>
              </tr>
            </thead>
            <tbody>
              {allClubRules.map((rule) => {
                const p1 = rule.sourcePlayer
                const p2 = rule.targetPlayer
                const p1Photo = p1?.photoURL || birdie
                const p2Photo = p2?.photoURL || birdie

                return (
                  <tr key={rule.id} className="club-manager-table-rows" style={{ textAlign: 'center' }}>
                    <td style={{ padding: '1vh 0.5vw' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <img
                          src={p1Photo}
                          alt="player1"
                          style={{
                            width: '3.5vh',
                            height: '3.5vh',
                            minWidth: '3.5vh',
                            minHeight: '3.5vh',
                            maxWidth: '3.5vh',
                            maxHeight: '3.5vh',
                            borderRadius: '38%',
                            objectFit: 'cover',
                            flexShrink: 0
                          }}
                        />
                        <span style={{ fontWeight: 600, color: '#fff', fontSize: '1.8vh' }}>
                          {p1?.firstName} {p1?.familyName || ''}
                        </span>
                        <span
                          style={{ cursor: 'pointer', opacity: 0.8, display: 'inline-flex', alignItems: 'center' }}
                          title={isEn ? `Edit constraints for ${p1?.firstName}` : `ערוך אילוצי ${p1?.firstName}`}
                          onClick={() => setSelectedPlayerForModal(p1)}
                        >
                          <img
                            src={editPlayerImg}
                            alt="edit"
                            style={{ width: '2vh', height: '2vh', minWidth: '2vh', minHeight: '2vh', margin: 0 }}
                          />
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '1vh 0.5vw' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <img
                          src={p2Photo}
                          alt="player2"
                          style={{
                            width: '3.5vh',
                            height: '3.5vh',
                            minWidth: '3.5vh',
                            minHeight: '3.5vh',
                            maxWidth: '3.5vh',
                            maxHeight: '3.5vh',
                            borderRadius: '38%',
                            objectFit: 'cover',
                            flexShrink: 0
                          }}
                        />
                        <span style={{ fontWeight: 600, color: '#fff', fontSize: '1.8vh' }}>
                          {p2 ? `${p2.firstName} ${p2.familyName || ''}` : (rule.targetPlayerId || 'Unknown')}
                        </span>
                        {p2 && (
                          <span
                            style={{ cursor: 'pointer', opacity: 0.8, display: 'inline-flex', alignItems: 'center' }}
                            title={isEn ? `Edit constraints for ${p2.firstName}` : `ערוך אילוצי ${p2.firstName}`}
                            onClick={() => setSelectedPlayerForModal(p2)}
                          >
                            <img
                              src={editPlayerImg}
                              alt="edit"
                              style={{ width: '2vh', height: '2vh', minWidth: '2vh', minHeight: '2vh', margin: 0 }}
                            />
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '1vh 0.5vw' }}>{renderRuleBadge('partner', rule.partnerRule)}</td>
                    <td style={{ padding: '1vh 0.5vw' }}>{renderRuleBadge('court', rule.courtRule)}</td>

                    <td style={{ padding: '1vh 0.5vw' }}>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => handleDeleteRule(rule.sourcePlayer.id, rule.targetPlayerId)}
                        disabled={isDeleting}
                        title={isEn ? 'Delete rule' : 'מחק אילוץ'}
                      >
                        {isEn ? 'Delete' : 'מחק'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {selectedPlayerForModal && (
          <PlayerRestrictionsModal
            playerDoc={selectedPlayerForModal}
            allClubPlayersDocs={allClubPlayersDocs || []}
            isEn={isEn}
            done={() => setSelectedPlayerForModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
