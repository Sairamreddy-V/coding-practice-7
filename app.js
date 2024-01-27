// importing the modules
const express = require('express')
const app = express()
app.use(express.json())

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const filePath = path.join(__dirname, 'cricketMatchDetails.db')

let db

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: filePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log(`server running....`)
    })
  } catch (error) {
    console.log(`db.Error:${error.message}`)
    process.exit(1)
  }
}
initializeDbAndServer()

const responseObjOfPlayerDetails = eachPlayer => {
  return {
    playerId: eachPlayer.player_id,
    playerName: eachPlayer.player_name,
  }
}

// geting the all player details
app.get('/players/', async (request, response) => {
  const query = `
    SELECT 
        * 
    FROM 
        player_details`
  const playerDetailsResult = await db.all(query)
  response.send(
    playerDetailsResult.map(eachPlayer =>
      responseObjOfPlayerDetails(eachPlayer),
    ),
  )
})

//getting the specific player
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const query = `
    SELECT 
        *
    FROM 
        player_details
    WHERE
        player_id=${playerId}`
  const result = await db.get(query)
  response.send({
    playerId: result.player_id,
    playerName: result.player_name,
  })
})

//updating a player
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body
  const query = `
  UPDATE
    player_details
  SET
    player_name='${playerName}'`
  await db.run(query)
  response.send(`Player Details Updated`)
})

//getting all matches
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const query = `
  SELECT 
    *
  FROM 
    match_details
  WHERE 
    match_id=${matchId}`
  const result = await db.get(query)
  response.send({
    matchId: result.match_id,
    match: result.match,
    year: result.year,
  })
})

//api-5
app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const queryForMAtchIds = `
  SELECT 
    match_id
  FROM 
    player_match_score
  WHERE 
    player_id=${playerId}`
  const mathIdList = await db.all(queryForMAtchIds)
  let finalResult = []
  for (let eachMatchId of mathIdList) {
    const matchId = eachMatchId.match_id
    const query = `
    SELECT 
      *
    FROM 
      match_details
    WHERE 
      match_id=${matchId}`
    const result = await db.get(query)
    const matchDetails = {
      matchId: result.match_id,
      match: result.match,
      year: result.year,
    }
    finalResult.push(matchDetails)
  }
  response.send(finalResult)
})

//api-6
app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  console.log(matchId)
  const queryTogetplayerId = `
  SELECT 
    player_id
  FROM 
    player_match_score
  WHERE 
    match_id=${matchId}`
  const playerIdList = await db.all(queryTogetplayerId)
  console.log(playerIdList)
  let finalResult = []
  for (let eachplayer of playerIdList) {
    const playerId = eachplayer.player_id
    const query = `
    SELECT
      *
    FROM 
      player_details
    WHERE
      player_id=${playerId}`
    const result = await db.get(query)
    const responseResult = {
      playerID: result.player_id,
      playerName: result.player_name,
    }
    console.log(responseResult)
    finalResult.push(responseResult)
  }
  response.send(finalResult)
})

//api-7
app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const query = `
  SELECT
    *
  FROM 
    player_match_score
  WHERE 
    player_id=${playerId}`
  const scoresResult = await db.all(query)
  let totalScore = 0
  let totalFours = 0
  let totalSixes = 0
  for (let scores of scoresResult) {
    totalScore += scores.score
    totalFours += scores.fours
    totalSixes += scores.sixes
  }
  const playerQuery = `
  SELECT 
    * 
  FROM 
    player_details
  WHERE 
    player_id=${playerId}`
  const playerDetails = await db.get(playerQuery)
  response.send({
    playerId: playerDetails.player_id,
    playerName: playerDetails.player_name,
    totalScore: totalScore,
    totalFours: totalFours,
    totalSixes: totalSixes,
  })
})

module.exports = app
