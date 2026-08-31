/**
 * Smart Matchmaking Engine for Badminton / Racket Sports Sessions
 */

export const getPlayerRank = (playerOrId, allClubPlayersDocs = []) => {
  if (!playerOrId) return 3
  if (typeof playerOrId === 'object') {
    const rank = Number(playerOrId.rank)
    return rank >= 1 && rank <= 5 ? rank : 3
  }
  const playerDoc = allClubPlayersDocs.find((p) => p.id === playerOrId)
  if (playerDoc) {
    const rank = Number(playerDoc.rank)
    return rank >= 1 && rank <= 5 ? rank : 3
  }
  return 3
}

/**
 * Standard sorting for waiting players:
 * 1. Primary: Players with fewer games in session (gamesInSession ASC)
 * 2. Secondary: Players who finished earlier / waited longer (endedLastGame ASC)
 */
export const sortWaitingPlayers = (players = []) => {
  const getSeconds = (firebaseDate) => {
    if (!firebaseDate) return 0
    if (firebaseDate.seconds !== undefined) return firebaseDate.seconds
    if (firebaseDate.toDate) return Math.floor(firebaseDate.toDate().getTime() / 1000)
    if (firebaseDate instanceof Date) return Math.floor(firebaseDate.getTime() / 1000)
    return 0
  }

  return [...players].sort((a, b) => {
    const aGames = a.gamesInSession || 0
    const bGames = b.gamesInSession || 0
    if (aGames !== bGames) return aGames - bGames

    const aTime = getSeconds(a.endedLastGame)
    const bTime = getSeconds(b.endedLastGame)
    return aTime - bTime
  })
}

/**
 * Checks if two players have already played together as partners in this session
 */
export const havePlayedTogether = (player1Id, player2Id, doneGames = []) => {
  if (!player1Id || !player2Id || !doneGames) return false
  return doneGames.some((game) => {
    const inWinTeam = game.winTeam && game.winTeam.includes(player1Id) && game.winTeam.includes(player2Id)
    const inLoseTeam = game.loseTeam && game.loseTeam.includes(player1Id) && game.loseTeam.includes(player2Id)
    return inWinTeam || inLoseTeam
  })
}

/**
 * Checks if a player has already played a "חיזוק" game today (partner was >= 2 ranks lower)
 */
export const hasHadMentoringGame = (playerId, doneGames = [], allClubPlayersDocs = []) => {
  const myRank = getPlayerRank(playerId, allClubPlayersDocs)
  return doneGames.some((game) => {
    let partnerId = null
    if (game.winTeam && game.winTeam.includes(playerId)) {
      partnerId = game.winTeam.find((id) => id !== playerId)
    } else if (game.loseTeam && game.loseTeam.includes(playerId)) {
      partnerId = game.loseTeam.find((id) => id !== playerId)
    }
    if (!partnerId) return false
    const partnerRank = getPlayerRank(partnerId, allClubPlayersDocs)
    return (myRank - partnerRank) >= 2
  })
}

/**
 * Checks if a player has already played an "אתגר" game today (partner was >= 2 ranks higher)
 */
export const hasHadChallengeGame = (playerId, doneGames = [], allClubPlayersDocs = []) => {
  const myRank = getPlayerRank(playerId, allClubPlayersDocs)
  return doneGames.some((game) => {
    let partnerId = null
    if (game.winTeam && game.winTeam.includes(playerId)) {
      partnerId = game.winTeam.find((id) => id !== playerId)
    } else if (game.loseTeam && game.loseTeam.includes(playerId)) {
      partnerId = game.loseTeam.find((id) => id !== playerId)
    }
    if (!partnerId) return false
    const partnerRank = getPlayerRank(partnerId, allClubPlayersDocs)
    return (partnerRank - myRank) >= 2
  })
}

export const CONSTRAINT_LEVELS = {
  NONE: 'NONE',           // מותר / אין הגבלה
  PREFER: 'PREFER',       // רצוי כבן זוג (לפחות משחק אחד בסשן)
  AVOID: 'AVOID',         // רצוי שלא (קנס ניקוד)
  FORBIDDEN: 'FORBIDDEN'  // אסור לחלוטין (חסימה)
}

/**
 * Normalizes a restriction object to support both new (partnerRule + courtRule)
 * and legacy (type) structures.
 */
export const normalizeConstraint = (r) => {
  if (!r) return { partnerRule: 'NONE', courtRule: 'NONE', notes: '' }

  let partnerRule = r.partnerRule || 'NONE'
  let courtRule = r.courtRule || 'NONE'

  // Backward compatibility with legacy r.type
  if (r.type) {
    if (r.type === 'FORBIDDEN_COURT') {
      courtRule = 'FORBIDDEN'
      partnerRule = 'FORBIDDEN'
    } else if (r.type === 'FORBIDDEN_PARTNER') {
      partnerRule = 'FORBIDDEN'
    } else if (r.type === 'AVOID_COURT') {
      courtRule = 'AVOID'
      if (partnerRule === 'NONE') partnerRule = 'AVOID'
    } else if (r.type === 'AVOID_PARTNER') {
      partnerRule = 'AVOID'
    }
  }

  return {
    partnerRule,
    courtRule,
    notes: r.notes || '',
    targetPlayerId: r.targetPlayerId,
    updatedAt: r.updatedAt || r.createdAt || null
  }
}

/**
 * Returns the relationship constraint between two players.
 * Evaluates symmetrically (p1 -> p2 and p2 -> p1), taking the stricter rule for each dimension.
 */
export const getPlayerRelationship = (p1Id, p2Id, allClubPlayersDocs = []) => {
  if (!p1Id || !p2Id || p1Id === p2Id) {
    return { partnerRule: 'NONE', courtRule: 'NONE', notes: '', exists: false }
  }

  const p1 = allClubPlayersDocs.find((p) => p.id === p1Id)
  const p2 = allClubPlayersDocs.find((p) => p.id === p2Id)

  const r1Raw = p1?.restrictions?.find((r) => r.targetPlayerId === p2Id)
  const r2Raw = p2?.restrictions?.find((r) => r.targetPlayerId === p1Id)

  const r1 = normalizeConstraint(r1Raw)
  const r2 = normalizeConstraint(r2Raw)

  const getStricter = (rule1, rule2) => {
    if (rule1 === 'FORBIDDEN' || rule2 === 'FORBIDDEN') return 'FORBIDDEN'
    if (rule1 === 'AVOID' || rule2 === 'AVOID') return 'AVOID'
    if (rule1 === 'PREFER' || rule2 === 'PREFER') return 'PREFER'
    return 'NONE'
  }

  const partnerRule = getStricter(r1.partnerRule, r2.partnerRule)
  const courtRule = getStricter(r1.courtRule, r2.courtRule)
  const notes = r1.notes || r2.notes || ''
  const exists = partnerRule !== 'NONE' || courtRule !== 'NONE'

  return {
    partnerRule,
    courtRule,
    notes,
    exists
  }
}

/**
 * Legacy export for backward compatibility
 */
export const CONSTRAINT_TYPES = {
  FORBIDDEN_COURT: 'FORBIDDEN_COURT',
  FORBIDDEN_PARTNER: 'FORBIDDEN_PARTNER',
  AVOID_COURT: 'AVOID_COURT',
  AVOID_PARTNER: 'AVOID_PARTNER'
}

/**
 * Finds the optimal 4-player or partial-fill match for a given court
 */
export const findOptimalMatch = ({ court, waitingPlayers = [], allClubPlayersDocs = [], doneGames = [] }) => {
  const sortedQueue = sortWaitingPlayers(waitingPlayers)
  const currentA = court.aTeam || []
  const currentB = court.bTeam || []

  const slotsNeededA = 2 - currentA.length
  const slotsNeededB = 2 - currentB.length
  const totalSlotsNeeded = slotsNeededA + slotsNeededB

  if (totalSlotsNeeded <= 0) {
    return { aTeam: currentA, bTeam: currentB, success: true }
  }

  if (sortedQueue.length < totalSlotsNeeded) {
    return { aTeam: currentA, bTeam: currentB, success: false, reason: 'NOT_ENOUGH_PLAYERS' }
  }

  // Candidate pool of top waiting players (up to 16 from the lowest games tier)
  const minGamesInQueue = sortedQueue[0]?.gamesInSession || 0
  const sameGamesTierCount = sortedQueue.filter((p) => (p.gamesInSession || 0) === minGamesInQueue).length
  const candidatePoolSize = Math.min(sortedQueue.length, Math.max(totalSlotsNeeded + 10, Math.min(sameGamesTierCount, 16)))
  const candidatePool = sortedQueue.slice(0, candidatePoolSize)

  // Helper to get combinations of k elements from array
  const getCombinations = (arr, k) => {
    if (k === 0) return [[]]
    if (arr.length === 0) return []
    const head = arr[0]
    const tail = arr.slice(1)
    const withHead = getCombinations(tail, k - 1).map((c) => [head, ...c])
    const withoutHead = getCombinations(tail, k)
    return [...withHead, ...withoutHead]
  }

  let bestMatch = null
  let bestScore = Infinity

  // 1. Pick players to fill Team A
  const combosForA = getCombinations(candidatePool, slotsNeededA)

  for (const chosenA of combosForA) {
    const chosenAIds = chosenA.map((p) => p.id)
    const remainingForB = candidatePool.filter((p) => !chosenAIds.includes(p.id))
    const combosForB = getCombinations(remainingForB, slotsNeededB)

    for (const chosenB of combosForB) {
      const fullA = [...currentA, ...chosenAIds]
      const fullB = [...currentB, ...chosenB.map((p) => p.id)]

      const ranksA = fullA.map((id) => getPlayerRank(id, allClubPlayersDocs))
      const ranksB = fullB.map((id) => getPlayerRank(id, allClubPlayersDocs))

      const sumA = ranksA.reduce((acc, r) => acc + r, 0)
      const sumB = ranksB.reduce((acc, r) => acc + r, 0)

      const allChosenIds = [...fullA, ...fullB]

      // =========================================================================
      // 0. Player Relationship Constraints (Social / Friction Rules)
      // =========================================================================
      // 0a. Court-Level Constraints (Same court, whether partners or opponents)
      let hasForbiddenCourt = false
      let courtAvoidPenalty = 0

      for (let i = 0; i < allChosenIds.length; i++) {
        for (let j = i + 1; j < allChosenIds.length; j++) {
          const rel = getPlayerRelationship(allChosenIds[i], allChosenIds[j], allClubPlayersDocs)
          if (rel.courtRule === 'FORBIDDEN') {
            hasForbiddenCourt = true
            break
          }
          if (rel.courtRule === 'AVOID') {
            courtAvoidPenalty += 2000
          }
        }
        if (hasForbiddenCourt) break
      }

      if (hasForbiddenCourt) {
        continue // Disqualify combination completely
      }

      // 0b. Partner-Level Constraints (Same team / partners)
      const checkPartnerConstraint = (p1Id, p2Id) => {
        if (!p1Id || !p2Id) return { forbidden: false, penalty: 0, bonus: 0 }
        const rel = getPlayerRelationship(p1Id, p2Id, allClubPlayersDocs)
        if (rel.partnerRule === 'FORBIDDEN') return { forbidden: true, penalty: 0, bonus: 0 }
        if (rel.partnerRule === 'AVOID') return { forbidden: false, penalty: 1000, bonus: 0 }
        if (rel.partnerRule === 'PREFER') {
          // If they haven't played together yet in this session, give a strong preference boost (-800)
          if (!havePlayedTogether(p1Id, p2Id, doneGames)) {
            return { forbidden: false, penalty: 0, bonus: 800 }
          }
        }
        return { forbidden: false, penalty: 0, bonus: 0 }
      }

      let hasForbiddenPartner = false
      let partnerAvoidPenalty = 0
      let partnerPreferBonus = 0

      if (fullA.length === 2) {
        const resA = checkPartnerConstraint(fullA[0], fullA[1])
        if (resA.forbidden) hasForbiddenPartner = true
        partnerAvoidPenalty += resA.penalty
        partnerPreferBonus += resA.bonus
      }
      if (!hasForbiddenPartner && fullB.length === 2) {
        const resB = checkPartnerConstraint(fullB[0], fullB[1])
        if (resB.forbidden) hasForbiddenPartner = true
        partnerAvoidPenalty += resB.penalty
        partnerPreferBonus += resB.bonus
      }

      if (hasForbiddenPartner) {
        continue // Disqualify combination completely
      }

      let score = courtAvoidPenalty + partnerAvoidPenalty - partnerPreferBonus

      // =========================================================================
      // 1. Team Balance (Equal Strength: Dominant Factor)
      // =========================================================================
      const balanceDiff = Math.abs(sumA - sumB)
      score += balanceDiff * 450

      // =========================================================================
      // 2. Rank Spread across the 4 players
      // Spread 0 & 1 are top tier. Spread 2+ is slightly penalized.
      // =========================================================================
      const allRanks = [...ranksA, ...ranksB]
      const minRank = Math.min(...allRanks)
      const maxRank = Math.max(...allRanks)
      const rankSpread = maxRank - minRank

      if (rankSpread === 0) {
        score += 0
      } else if (rankSpread === 1) {
        score += 10
      } else {
        score += rankSpread * 20
      }

      // =========================================================================
      // 3. Queue Priority (Serve waiting queue fairly)
      // =========================================================================
      allChosenIds.forEach((id) => {
        const qIdx = sortedQueue.findIndex((p) => p.id === id)
        if (qIdx !== -1) {
          score += qIdx * 10
        }
      })

      // =========================================================================
      // 4. Partner Duplication Penalty (Avoid repeating same partner today)
      // =========================================================================
      if (fullA.length === 2 && havePlayedTogether(fullA[0], fullA[1], doneGames)) {
        score += 250
      }
      if (fullB.length === 2 && havePlayedTogether(fullB[0], fullB[1], doneGames)) {
        score += 250
      }

      // =========================================================================
      // 5. Growth Pair Rules:
      // - diff <= 1: 🟢 Balanced (0 base penalty)
      // - Natural Growth Pairs:
      //   - 5 with 3 (gap 2)
      //   - 4 with 2 (gap 2)
      //   - 3 with 1 (gap 2)
      //   - 4 with 1 (gap 3 - Rank 1 reinforced by Rank 4!)
      //   -> In warmup (game 0): +350 penalty (keep warmup balanced).
      //   -> Mid-session (game 1+): Welcome bonus (-50).
      //   -> If either already had growth match: Hard lockout (+500 to +800).
      // - Extreme Gaps: 5 with 2 (gap 3), 5 with 1 (gap 4) -> Heavy penalty (+400).
      // =========================================================================
      const evaluatePairRanks = (p1Id, p2Id) => {
        if (!p1Id || !p2Id) return
        const r1 = getPlayerRank(p1Id, allClubPlayersDocs)
        const r2 = getPlayerRank(p2Id, allClubPlayersDocs)
        const diff = Math.abs(r1 - r2)

        if (diff >= 2) {
          const p1Doc = sortedQueue.find((p) => p.id === p1Id)
          const p2Doc = sortedQueue.find((p) => p.id === p2Id)
          const games1 = p1Doc?.gamesInSession || 0
          const games2 = p2Doc?.gamesInSession || 0

          // In the warm-up phase (first match of the session), keep everyone strictly Balanced!
          if (games1 < 1 || games2 < 1) {
            score += 350
            return
          }

          const minR = Math.min(r1, r2)
          const maxR = Math.max(r1, r2)

          // Extreme gaps: 5 with 2 (gap 3), 5 with 1 (gap 4)
          const isExtreme = (diff >= 3 && !(minR === 1 && maxR === 4))
          if (isExtreme) {
            score += 400
          }

          const higherPlayerId = r1 > r2 ? p1Id : p2Id
          const lowerPlayerId = r1 > r2 ? p2Id : p1Id

          const higherAlreadyMentored = hasHadMentoringGame(higherPlayerId, doneGames, allClubPlayersDocs)
          const lowerAlreadyChallenged = hasHadChallengeGame(lowerPlayerId, doneGames, allClubPlayersDocs)

          if (higherAlreadyMentored || lowerAlreadyChallenged) {
            // Already had their growth match today -> strictly avoid giving another!
            score += 500 + (higherAlreadyMentored ? 300 : 0) + (lowerAlreadyChallenged ? 300 : 0)
          } else if (!isExtreme) {
            // Natural growth pairs: 5 with 3, 4 with 2, 3 with 1, 4 with 1 -> Welcome bonus!
            score -= 50
          }
        }
      }

      if (fullA.length === 2) evaluatePairRanks(fullA[0], fullA[1])
      if (fullB.length === 2) evaluatePairRanks(fullB[0], fullB[1])

      if (score < bestScore) {
        bestScore = score
        bestMatch = { 
          aTeam: fullA, 
          bTeam: fullB, 
          success: true, 
          sumA, 
          sumB, 
          balanceDiff, 
          rankSpread,
          score 
        }
      }
    }
  }

  if (bestMatch) {
    console.log('[Matchmaking] Best match found:', {
      teamA: bestMatch.aTeam.map(id => {
        const p = allClubPlayersDocs.find(x => x.id === id)
        return `${p?.firstName} (R${getPlayerRank(id, allClubPlayersDocs)})`
      }),
      teamB: bestMatch.bTeam.map(id => {
        const p = allClubPlayersDocs.find(x => x.id === id)
        return `${p?.firstName} (R${getPlayerRank(id, allClubPlayersDocs)})`
      }),
      balanceDiff: bestMatch.balanceDiff,
      rankSpread: bestMatch.rankSpread,
      score: bestMatch.score
    })
  }

  return bestMatch || { aTeam: currentA, bTeam: currentB, success: false }
}
