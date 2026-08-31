import { useState } from 'react'
import Select from 'react-select'
import { motion, AnimatePresence } from 'framer-motion'
import { useFirestore } from '../../hooks/useFirestore'
import { CONSTRAINT_LEVELS, normalizeConstraint } from '../../utils/matchmaking'
import birdie from '../../assets/birdie.jpg'

export default function PlayerRestrictionsModal({ playerDoc, allClubPlayersDocs = [], isEn, done }) {
  const { updateDocument } = useFirestore('players')

  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [partnerRule, setPartnerRule] = useState(CONSTRAINT_LEVELS.FORBIDDEN)
  const [courtRule, setCourtRule] = useState(CONSTRAINT_LEVELS.NONE)
  const [isSaving, setIsSaving] = useState(false)

  if (!playerDoc) return null

  const currentRestrictions = (playerDoc.restrictions || []).map(normalizeConstraint)

  // Other players to choose from (excluding current player)
  const otherPlayers = allClubPlayersDocs.filter((p) => p.id !== playerDoc.id)

  const playerOptions = otherPlayers.map((p) => ({
    value: p.id,
    label: `${p.firstName} ${p.familyName || ''}${p.nickName ? ` (${p.nickName})` : ''}`,
    player: p
  }))

  const partnerRuleOptions = [
    { value: CONSTRAINT_LEVELS.NONE, label: isEn ? '✅ Allowed as partner' : '✅ מותר כבן זוג' },
    { value: CONSTRAINT_LEVELS.PREFER, label: isEn ? '⭐ Preferred partner (at least 1 game)' : '⭐ רצוי כבן זוג (לפחות משחק 1)' },
    { value: CONSTRAINT_LEVELS.AVOID, label: isEn ? '⚠️ Prefer not as partner' : '⚠️ רצוי שלא כבן זוג' },
    { value: CONSTRAINT_LEVELS.FORBIDDEN, label: isEn ? '🚫 Forbidden as partner' : '🚫 אסור כבן זוג' }
  ]

  const courtRuleOptions = [
    { value: CONSTRAINT_LEVELS.NONE, label: isEn ? '✅ Allowed on same court' : '✅ מותר על אותו מגרש' },
    { value: CONSTRAINT_LEVELS.AVOID, label: isEn ? '🚷 Prefer not on same court' : '🚷 רצוי שלא באותו מגרש' },
    { value: CONSTRAINT_LEVELS.FORBIDDEN, label: isEn ? '⛔ Forbidden on same court' : '⛔ אסור על אותו מגרש' }
  ]

  // Find incoming restrictions (defined on other players targeting this player)
  const incomingRestrictions = allClubPlayersDocs.flatMap((p) => {
    if (p.id === playerDoc.id) return []
    const match = (p.restrictions || []).find((r) => r.targetPlayerId === playerDoc.id)
    if (!match) return []
    return [{
      ...normalizeConstraint(match),
      fromPlayerId: p.id,
      fromPlayer: p
    }]
  })

  const handleAddConstraint = async (e) => {
    e.preventDefault()
    if (!selectedPlayer) return

    // If both rules are NONE, nothing to add
    if (partnerRule === CONSTRAINT_LEVELS.NONE && courtRule === CONSTRAINT_LEVELS.NONE) {
      alert(isEn ? 'Please select at least one restriction rule (Partner or Court)' : 'נא לבחור לפחות אילוץ אחד (בן זוג או מגרש)')
      return
    }

    setIsSaving(true)
    const targetId = selectedPlayer.value
    const rawList = playerDoc.restrictions || []
    const existingIdx = rawList.findIndex((r) => r.targetPlayerId === targetId)
    let updated = [...rawList]

    const newConstraint = {
      targetPlayerId: targetId,
      partnerRule,
      courtRule,
      updatedAt: new Date().toISOString()
    }

    if (existingIdx !== -1) {
      updated[existingIdx] = newConstraint
    } else {
      updated.push(newConstraint)
    }

    await updateDocument(playerDoc.id, { restrictions: updated })
    setSelectedPlayer(null)
    setPartnerRule(CONSTRAINT_LEVELS.FORBIDDEN)
    setCourtRule(CONSTRAINT_LEVELS.NONE)
    setIsSaving(false)
  }

  const handleDeleteConstraint = async (targetPlayerId) => {
    setIsSaving(true)
    const rawList = playerDoc.restrictions || []
    const updated = rawList.filter((r) => r.targetPlayerId !== targetPlayerId)
    await updateDocument(playerDoc.id, { restrictions: updated })
    setIsSaving(false)
  }

  const handleDeleteIncomingConstraint = async (fromPlayerId) => {
    setIsSaving(true)
    const fromPlayer = allClubPlayersDocs.find((p) => p.id === fromPlayerId)
    if (fromPlayer) {
      const updated = (fromPlayer.restrictions || []).filter((r) => r.targetPlayerId !== playerDoc.id)
      await updateDocument(fromPlayerId, { restrictions: updated })
    }
    setIsSaving(false)
  }

  const renderRuleBadge = (type, rule) => {
    if (rule === CONSTRAINT_LEVELS.NONE) return null
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
    return null
  }

  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: 'var(--input-text-bg)',
      borderColor: 'var(--card-color)',
      color: 'var(--bg-color)',
      minHeight: '4.5vh',
      height: '4.5vh',
      fontSize: '1.8vh',
      fontFamily: '"Noto Serif Hebrew", serif',
      boxShadow: 'none',
      '&:hover': {
        borderColor: 'var(--heading-color)'
      }
    }),
    valueContainer: (provided) => ({
      ...provided,
      height: '4.5vh',
      padding: '0 8px'
    }),
    input: (provided) => ({
      ...provided,
      margin: '0px'
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: '4.5vh'
    }),
    option: (provided, state) => ({
      ...provided,
      color: 'var(--bg-color)',
      backgroundColor: state.isSelected ? 'var(--card-color)' : state.isFocused ? '#fcd8e5' : 'white',
      cursor: 'pointer',
      fontSize: '1.8vh',
      fontFamily: '"Noto Serif Hebrew", serif'
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'var(--bg-color)',
      fontSize: '1.8vh',
      fontFamily: '"Noto Serif Hebrew", serif'
    }),
    placeholder: (provided) => ({
      ...provided,
      fontSize: '1.8vh',
      color: 'rgba(0,0,0,0.5)'
    })
  }

  return (
    <div className="modal-backdrop" onClick={done}>
      <motion.div
        className="modal-content player-restrictions-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.85, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: -20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div className="modal-header">
          <h2>👥 {isEn ? `Matchmaking Constraints - ${playerDoc.firstName} ${playerDoc.familyName || ''}` : `אילוצי שיבוץ ויחסים - ${playerDoc.firstName} ${playerDoc.familyName || ''}`}</h2>
          <button type="button" className="modal-close-btn" onClick={done}>✕</button>
        </div>

        {/* Add New Restriction Form Card */}
        <div className="restrictions-modal-add-box">
          <h3>{isEn ? '➕ Add / Update Restriction' : '➕ הוספת / עדכון אילוץ חדש'}</h3>
          
          <div className="modal-form-grid">
            <div className="modal-field-full">
              <label className="modal-field-label">{isEn ? 'Against Player:' : 'מול שחקן:'}</label>
              <Select
                styles={customSelectStyles}
                options={playerOptions}
                value={selectedPlayer}
                onChange={(opt) => {
                  setSelectedPlayer(opt)
                  if (opt) {
                    const exist = currentRestrictions.find((r) => r.targetPlayerId === opt.value)
                    if (exist) {
                      setPartnerRule(exist.partnerRule)
                      setCourtRule(exist.courtRule)
                    }
                  }
                }}
                placeholder={isEn ? 'Select a player from club...' : 'בחר שחקן מהמועדון...'}
                isClearable
              />
            </div>

            <div className="modal-field-half">
              <label className="modal-field-label">{isEn ? 'Partner Rule:' : 'יחס כבני זוג:'}</label>
              <select
                className="restrictions-modal-select"
                value={partnerRule}
                onChange={(e) => setPartnerRule(e.target.value)}
              >
                {partnerRuleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-field-half">
              <label className="modal-field-label">{isEn ? 'Court Rule:' : 'יחס על אותו מגרש:'}</label>
              <select
                className="restrictions-modal-select"
                value={courtRule}
                onChange={(e) => setCourtRule(e.target.value)}
              >
                {courtRuleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-add-btn-wrap">
            <button
              type="button"
              className="btn"
              onClick={handleAddConstraint}
              disabled={!selectedPlayer || isSaving}
            >
              {isSaving ? (isEn ? 'Saving...' : 'שומר...') : (isEn ? 'Save' : 'שמור')}
            </button>
          </div>
        </div>

        {/* List of Defined Constraints */}
        <div className="restrictions-modal-list-box">
          <h3>
            {isEn ? 'Defined Restrictions for this player' : 'אילוצים שהוגדרו עבור שחקן זה'} ({currentRestrictions.length})
          </h3>

          {currentRestrictions.length === 0 ? (
            <p className="no-restrictions-msg">
              {isEn ? 'No restrictions defined for this player.' : 'לא הוגדרו אילוצים עבור שחקן זה.'}
            </p>
          ) : (
            <div className="restrictions-modal-grid">
              <AnimatePresence>
                {currentRestrictions.map((r) => {
                  const targetPlayer = allClubPlayersDocs.find((p) => p.id === r.targetPlayerId)
                  const targetName = targetPlayer
                    ? `${targetPlayer.firstName} ${targetPlayer.familyName || ''}`
                    : (r.targetPlayerId || 'Unknown')
                  const targetPhoto = targetPlayer?.photoURL || birdie

                  return (
                    <motion.div
                      key={r.targetPlayerId}
                      className="restriction-modal-card"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <button
                        type="button"
                        className="btn"
                        onClick={() => handleDeleteConstraint(r.targetPlayerId)}
                        title={isEn ? 'Delete restriction' : 'מחק אילוץ'}
                        disabled={isSaving}
                      >
                        {isEn ? 'Delete' : 'מחק'}
                      </button>

                      <div className="restriction-badges-wrapper">
                        {renderRuleBadge('partner', r.partnerRule)}
                        {renderRuleBadge('court', r.courtRule)}
                      </div>

                      <div className="restriction-player-info">
                        <span className="restriction-target-name">{targetName}</span>
                        <img src={targetPhoto} alt={targetName} className="restriction-avatar" />
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Incoming Restrictions List */}
        {incomingRestrictions.length > 0 && (
          <div className="restrictions-modal-list-box incoming-box">
            <h3>
              {isEn
                ? 'Incoming Restrictions (defined by other players towards this player)'
                : 'אילוצים שהוגדרו על ידי שחקנים אחרים כלפי שחקן זה'} ({incomingRestrictions.length})
            </h3>
            <div className="restrictions-modal-grid">
              <AnimatePresence>
                {incomingRestrictions.map((r) => {
                  const fromPlayer = r.fromPlayer
                  const fromName = fromPlayer
                    ? `${fromPlayer.firstName} ${fromPlayer.familyName || ''}`
                    : (r.fromPlayerId || 'Unknown')
                  const fromPhoto = fromPlayer?.photoURL || birdie

                  return (
                    <motion.div
                      key={`incoming-${r.fromPlayerId}`}
                      className="restriction-modal-card incoming-card"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <button
                        type="button"
                        className="btn"
                        onClick={() => handleDeleteIncomingConstraint(r.fromPlayerId)}
                        title={isEn ? 'Delete incoming restriction' : 'מחק אילוץ'}
                        disabled={isSaving}
                      >
                        {isEn ? 'Delete' : 'מחק'}
                      </button>

                      <div className="restriction-badges-wrapper">
                        {renderRuleBadge('partner', r.partnerRule)}
                        {renderRuleBadge('court', r.courtRule)}
                      </div>

                      <div className="restriction-player-info">
                        <span className="restriction-target-name">{fromName}</span>
                        <img src={fromPhoto} alt={fromName} className="restriction-avatar" />
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        )}

        <div className="modal-footer">
          <button type="button" className="btn btn-close-modal" onClick={done}>
            {isEn ? 'Close' : 'סגור'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
