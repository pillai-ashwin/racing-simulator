// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
let store = {
	track_id: undefined,
	player_id: undefined,
	race_id: undefined,
}

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
	onPageLoad()
	setupClickHandlers()
})

async function onPageLoad() {
	try {
		getTracks()
			.then(tracks => {
				const html = renderTrackCards(tracks)
				renderAt('#tracks', html)
			})
		getRacers()
			.then((racers) => {
				const html = renderRacerCars(racers)
				renderAt('#racers', html)
			})
	} catch(error) {
		console.log("Problem getting tracks and racers ::", error.message)
		console.error(error)
	}
}

function setupClickHandlers() {
	document.addEventListener('click', function(event) {
		let { target } = event
		// Race track form field
		if (target.matches('.card.track') || target.parentNode.matches('.card.track')) {
			if (target.parentNode.matches('.card.track')) { 
				target = target.parentNode;
			}
			handleSelectTrack(target)
		}
	  	// Podracer form field
		if (target.matches('.card.podracer') || target.parentNode.matches('.card.podracer')) {
			if (target.parentNode.matches('.card.podracer')) { 
				target = target.parentNode;
			}
			handleSelectPodRacer(target)
		}
				
		// Submit create race form
		if (target.matches('#submit-create-race')) {
			event.preventDefault()	
			// start race
			handleCreateRace()
		}
		// Handle acceleration click
		if (target.matches('#gas-peddle')) {
			handleAccelerate(target)
		}
	}, false)
}

async function delay(ms) {
	try {
		return await new Promise(resolve => setTimeout(resolve, ms));
	} catch(error) {
		console.log("an error shouldn't be possible here")
		console.log(error)
	}
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
	// Get player_id and track_id from the store	
	const player_id = store.player_id;
	const track_id = store.track_id;
	
	if (!player_id || !track_id) {
		alert("Please select racer and track to start the race!");
		return
	} 
	// const race = invoke the API call to create the race, then save the result
	try {
		const race = await createRace(player_id, track_id)
		// update the store with the race id
		store.race_id = race.ID - 1;
		// render starting UI
		renderAt('#race', renderRaceStartView(track_id))
		// The race has been created, now start the countdown
		// call the async function runCountdown
		await runCountdown()
		// call the async function startRace
		await startRace(store.race_id)
		// call the async function runRace
		await runRace(store.race_id)
	} catch (err) {
		console.log("Error in handleCreateRace: ", err.message)
	}
}

function runRace(raceID) {
	return new Promise(resolve => {
		// Javascript's built in setInterval method to get race info every 500ms
		const raceInterval = setInterval(async () => {
			/* 
				If the race info status property is "in-progress", update the leaderboard by calling:
				renderAt('#leaderBoard', raceProgress(res.positions))
				If the race info status property is "finished", run the following:
				clearInterval(raceInterval) // to stop the interval from repeating
				renderAt('#race', resultsView(res.positions)) // to render the results view
				reslove(res) // resolve the promise
			*/
			try {
				const raceStatus = await getRace(raceID)
				if (raceStatus.status === "in-progress") {
					renderAt('#leaderBoard', raceProgress(raceStatus.positions))
				} else if (raceStatus.status === "finished") {
					clearInterval(raceInterval) // to stop the interval from repeating
					renderAt('#race', resultsView(raceStatus.positions)) // to render the results view
					resolve(raceStatus) // resolve the promise
				} else {
					clearInterval(raceInterval)
					resolve(raceStatus)
				}
			} catch (error) {
				console.log("Error in handling getRace: ", error)
			}
		}, 500)
	})
}

async function runCountdown() {
	try {
		// wait for the DOM to load
		await delay(1000)
		let timer = 3
		return new Promise(resolve => {
			// Javascript's built in setInterval method to count down once per second
			const interval = setInterval(() => {
				if (timer !== 0) {
					// run this DOM manipulation to decrement the countdown for the user
					console.log(timer);
					// disable gas until count down has completed
					document.getElementById('gas-peddle').disabled = true;
					document.getElementById('big-numbers').innerHTML = --timer
				} else {
					// when countdown is done, clear the interval, resolve the promise, and return
					clearInterval(interval);
					resolve();
					// enable gas after count down timer has completed
					document.getElementById('gas-peddle').disabled = false;
				}
			}, 1000);			
		})
	} catch(error) {
		console.log(error);
	}
}

function handleSelectPodRacer(target) {
	console.log("selected a pod", target.id)
	// remove class selected from all racer options
	const selected = document.querySelector('#racers .selected')
	if(selected) {
		selected.classList.remove('selected')
	}
	// add class selected to current target
	target.classList.add('selected')
	// save the selected racer to the store
	store.player_id = parseInt(target.id)
}

function handleSelectTrack(target) {
	console.log("selected a track", target.id)
	// remove class selected from all track options
	const selected = document.querySelector('#tracks .selected')
	if(selected) {
		selected.classList.remove('selected')
	}
	// add class selected to current target
	target.classList.add('selected')
	// save the selected track id to the store
	store.track_id = parseInt(target.id)
}

function handleAccelerate() {
	// Invoke the API call to accelerate
	accelerate(store.race_id)
		.then(()=> console.log("accelerate button clicked"))
		.catch((error)=>console.log(error))
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
	if (!racers.length) {
		return `
			<h4>Loading Racers...</4>
		`
	}
	const results = racers.map(renderRacerCard).join('')
	return `
		<ul id="racers">
			${results}
		</ul>
	`
}

function renderRacerCard(racer) {
	const { id, driver_name, top_speed, acceleration, handling } = racer
	return `
		<li class="card podracer" id="${id}">
			<h3>${driver_name}</h3>
			<p>${top_speed}</p>
			<p>${acceleration}</p>
			<p>${handling}</p>
		</li>
	`
}

function renderTrackCards(tracks) {
	if (!tracks.length) {
		return `
			<h4>Loading Tracks...</4>
		`
	}
	const results = tracks.map(renderTrackCard).join('')
	return `
		<ul id="tracks">
			${results}
		</ul>
	`
}

function renderTrackCard(track) {
	const { id, name } = track
	return `
		<li id="${id}" class="card track">
			<h3>${name}</h3>
		</li>
	`
}

function renderCountdown(count) {
	return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`
}

function renderRaceStartView(track, racers) {
	return `
		<header>
			<h1>Race: Track ${track}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>
			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me Fast!!</button>
			</section>
		</main>
		<footer></footer>
	`
}

function resultsView(positions) {
	positions.sort((a, b) => (a.final_position > b.final_position) ? 1 : -1)
	return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			${raceProgress(positions)}
			<a href="/race">Start a new race</a>
		</main>
	`
}

function raceProgress(positions) {
	let userPlayer = positions.find(e => e.id === store.player_id)
	userPlayer.driver_name += " (you)"
	positions = positions.sort((a, b) => (a.segment > b.segment) ? -1 : 1)
	let count = 1
	const results = positions.map(p => {
		return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`
	})
	return `
		<main>
			<h3 class="inRace">Leaderboard</h3>
			<section id="leaderBoard">
				${results}
			</section>
		</main>
	`
}

function renderAt(element, html) {
	const node = document.querySelector(element)
	node.innerHTML = html
}

// ^ Provided code ^ do not remove

// API CALLS ------------------------------------------------

const SERVER = 'http://localhost:8000'

function defaultFetchOpts() {
	return {
		mode: 'cors',
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin' : SERVER,
		},
	}
}

// A fetch call (with error handling!) to each of the following API endpoints 

function getTracks() {
	return fetch(`${SERVER}/api/tracks`)
		.then(res => res.json())
		.catch(error => console.log("Error in getTracks request::", error))
}

function getRacers() {
	return fetch(`${SERVER}/api/cars`)
		.then(res => res.json())
		.catch(error => console.log("Error in getRacers request::", error))
}

function createRace(player_id, track_id) {
	player_id = parseInt(player_id)
	track_id = parseInt(track_id)
	const body = { player_id, track_id }	
	return fetch(`${SERVER}/api/races`, {
		method: 'POST',
		dataType: 'jsonp',
		body: JSON.stringify(body),
		...defaultFetchOpts()
	})
	.then(res => res.json())
	.catch(err => console.log("Error in createRace request::", err))
}

function getRace(id) {
	return fetch(`${SERVER}/api/races/${id}`)
		.then(res => res.json())
		.catch(error => console.log("Error in getRace request::", error))
}

function startRace(id) {
	return fetch(`${SERVER}/api/races/${id}/start`, {
		method: 'POST',
		...defaultFetchOpts(),
	})
		.catch(error => console.log("Error in startRace request::", error))
}


function accelerate(id) {
	return fetch(`${SERVER}/api/races/${id}/accelerate`,{
		method: 'POST',
		...defaultFetchOpts()
	})
	.catch(error => console.log(error))
}