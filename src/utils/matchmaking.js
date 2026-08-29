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

      let score = 0

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
      const allChosenIds = [...fullA, ...fullB]
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
