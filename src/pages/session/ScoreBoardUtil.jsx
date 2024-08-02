
const MIN_GAMES = 3
const WIN_WEIGHT = 3
const LOSE_WEIGHT = 1

const log = false
const Log = (tag, msg) => {
  if (log) {
    console.log("ScoreBaord: ", tag, msg)
  }
}

const calculateScoreBoard = ( activeSessionDoc, minGames=MIN_GAMES ) => {
  const scoreBoard = []
  const _allWins  = activeSessionDoc.doneGames.flatMap((game)=>[...game.winTeam])
  const _allLoses = activeSessionDoc.doneGames.flatMap((game)=>[...game.loseTeam])
  const _allTeams = [..._allWins,..._allLoses]

  // Uniquify list of all winners
  const _allWinningPlayers = []
  _allTeams.forEach((w)=>{
    if (!_allWinningPlayers.includes(w)) {
      _allWinningPlayers.push(w)
    }
  })
  _allWinningPlayers.forEach((playerId) => {
    const wins  = _allWins.filter((w)=>w===playerId).length
    const loses = _allLoses.filter((l)=>l===playerId).length
    const score = Math.max(0,(wins * WIN_WEIGHT) - (loses * LOSE_WEIGHT))
    scoreBoard.push({id: playerId, score, wins , loses, games: wins+loses, place: 0})
  })
  Log("scoreBoard",scoreBoard)
  const filteredScoreBoard = scoreBoard.filter((player)=>player.games>=minGames)
  Log("filteredScoreBoard",filteredScoreBoard)
  const sortedScoreBoard = filteredScoreBoard.sort((a,b) => {
    if (a.score > b.score) {
      return -1
    } else if (a.score < b.score) {
      return 1
    } else if (a.games > b.games) {
      return -1
    } else if (a.games < b.games) {
      return 1
    } else {
      return 0
    }
  })
  Log("sortedScoreBoard", sortedScoreBoard)
  let _place = 0
  sortedScoreBoard.forEach((player,index) => {
    if (_place ===0) {
      _place++
    } else if (player.score!==sortedScoreBoard[index-1].score || player.games !== sortedScoreBoard[index-1].games) {
      _place++
    }
    player.place = _place
  })
  Log("Ranked", sortedScoreBoard)
  return(sortedScoreBoard)
}

export { calculateScoreBoard }



