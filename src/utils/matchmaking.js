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
 * Checks if a player has already had a challenge (partner >= 2 ranks higher)
 * or mentoring (partner >= 2 ranks lower) game today
 */
export const hasHadExperienceGame = (playerId, doneGames = [], allClubPlayersDocs = []) => {
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
    return Math.abs(myRank - partnerRank) >= 2
  })
}

/**
 * Finds the optimal 4-player or partial-fill match for a given court
 */
export const findOptimalMatch = ({ court, waitingPlayers = [], allClubPlayersDocs = [], doneGames = [] }) => {
  const currentA = court.aTeam || []
  const currentB = court.bTeam || []

  const slotsNeededA = 2 - currentA.length
  const slotsNeededB = 2 - currentB.length
  const totalSlotsNeeded = slotsNeededA + slotsNeededB

  if (totalSlotsNeeded <= 0) {
    return { aTeam: currentA, bTeam: currentB, success: true }
  }

  if (waitingPlayers.length < totalSlotsNeeded) {
    return { aTeam: currentA, bTeam: currentB, success: false, reason: 'NOT_ENOUGH_PLAYERS' }
  }

  // Use top candidates from waiting queue (up to 12 candidates to balance queue priority and rank match)
  const candidatePoolSize = Math.min(waitingPlayers.length, Math.max(totalSlotsNeeded * 3, 10))
  const candidatePool = waitingPlayers.slice(0, candidatePoolSize)

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
      const fullB = [...currentB, ...chosenBIds(chosenB)]

      const score = evaluateMatchup({
        fullA,
        fullB,
        waitingPlayers,
        allClubPlayersDocs,
        doneGames
      })

      if (score < bestScore) {
        bestScore = score
        bestMatch = { aTeam: fullA, bTeam: fullB, success: true }
      }
    }
  }

  return bestMatch || { aTeam: currentA, bTeam: currentB, success: false }
}

const chosenBIds = (chosenB) => chosenB.map((p) => p.id)

/**
 * Scoring evaluation function (lower score is better)
 */
const evaluateMatchup = ({ fullA, fullB, waitingPlayers, allClubPlayersDocs, doneGames }) => {
  let score = 0

  const ranksA = fullA.map((id) => getPlayerRank(id, allClubPlayersDocs))
  const ranksB = fullB.map((id) => getPlayerRank(id, allClubPlayersDocs))

  const sumA = ranksA.reduce((acc, r) => acc + r, 0)
  const sumB = ranksB.reduce((acc, r) => acc + r, 0)

  // 1. Team Balance (Difference between Team A and Team B total rank)
  const balanceDiff = Math.abs(sumA - sumB)
  score += balanceDiff * 150 // Very heavy penalty for unbalanced teams

  // 2. Rank Spread across all 4 players (Prefer players of similar tier)
  const allRanks = [...ranksA, ...ranksB]
  const minRank = Math.min(...allRanks)
  const maxRank = Math.max(...allRanks)
  const rankSpread = maxRank - minRank
  score += rankSpread * 15

  // 3. Partner Duplication Penalty
  if (fullA.length === 2 && havePlayedTogether(fullA[0], fullA[1], doneGames)) {
    score += 250
  }
  if (fullB.length === 2 && havePlayedTogether(fullB[0], fullB[1], doneGames)) {
    score += 250
  }

  // 4. Queue Priority (Prefer players at the front of the waiting queue)
  const allPlayerIds = [...fullA, ...fullB]
  allPlayerIds.forEach((id) => {
    const queueIndex = waitingPlayers.findIndex((p) => p.id === id)
    if (queueIndex !== -1) {
      score += queueIndex * 3
    }
  })

  // 5. Challenge / Mentoring Bonus (Difference >= 2 between partners)
  const checkPairExperience = (p1Id, p2Id) => {
    if (!p1Id || !p2Id) return
    const r1 = getPlayerRank(p1Id, allClubPlayersDocs)
    const r2 = getPlayerRank(p2Id, allClubPlayersDocs)
    if (Math.abs(r1 - r2) >= 2) {
      // If neither has had an experience game today, give a slight bonus for diversity
      if (!hasHadExperienceGame(p1Id, doneGames, allClubPlayersDocs) || !hasHadExperienceGame(p2Id, doneGames, allClubPlayersDocs)) {
        score -= 20
      }
    }
  }

  if (fullA.length === 2) checkPairExperience(fullA[0], fullA[1])
  if (fullB.length === 2) checkPairExperience(fullB[0], fullB[1])

  return score
}
