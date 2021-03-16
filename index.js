const fetch = require('node-fetch');

let weapons = ["acc_mus","acc_blun","acc_nock","acc_ann","acc_rev","acc_pis","acc_duck","acc_mpis","acc_cut","acc_dag","acc_bot","acc_tomo","acc_gren","acc_rap"];
let substituteNames = ["Musket","Blunderbuss","Nockgun","Annley","Revolver","Pistol","Duckfoot","Short Pistol","Cutlass","Dagger","Bottle","Tomohawk","Grenade","Rapier"];

let shipWeaponry = ["acc_can","acc_swiv","acc_grape","acc_arson","acc_ram"];
let shipWeaponrySubNames = ["Cannonball","Swivel","Grapeshot","Fireshot","Ramming"];

let ships = ["acc_winHoy","acc_winJunk","acc_winSchoon","acc_cutt","acc_bombk","acc_carr","acc_gunb","acc_winGal","acc_brig","acc_xeb","acc_cru","acc_bombv"];
let subShipNames = ["Hoy","Junk","Schooner","Cutter","Bomb Ketch","Carrack","Gunboat","Galleon","Brig","Xebec","Cruiser","Bomb Vessel"];

let maintenance = ["acc_rep","acc_pump","acc_sail","acc_noseRep"];
let subMaintain = ["Hole Repairs","Pumping","Sail Repairs","Nose Repairs"];

let miscList = ["acc_head","acc_sup"];
let subMiscList = ["Headshots","Supplies"];

let steamKey;

exports.init = function(obj){
	if (validateString([obj])){
		steamKey = obj;
	}else{
		throw new Error('Incorrect input type. Should be a string.');
	}
}

function validateString(tests){
	for (let item in tests){
		if (typeof(item) !== "string"){
			return false;
		}
	}
	return true;
}

exports.handler = async function(type, steamID) {
	if (validateString([type,steamID])){
		let public = await checkIfPrivate(steamID);
		if (public){
			let data = await queryFor(type.toLowerCase(),steamID);
			return data;
		}else{
			return "User profile is set to private.";
		}
	}else{
		throw new Error('Incorrect input type. Should be a string array.');
	}
}

function checkIfPrivate(steamID){
	fetch(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamKey}&steamids=${steamID}`).then(resp => resp.json()).then(response => {
		if (response.response.players.communityvisibilitystate === 1){
			return false;
		}else{
			return true;
		}
	});
}

function queryFor(type, steamID){
	fetch(`https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v2?key=${steamKey}&appid=420290&steamid=${steamID}`).then(resp => resp.text()).then(response => {
		if (response.includes("500 Internal Server Error")){
			return "Steam API error, code 500";
		}else if (response.includes("Unknown problem determining WebApi request destination.")) {
			return "Please ensure you have entered the correct terms! Terms can be found using `;help` `blackwake`.\nThe format is as followed:\n`;blackwake` `term` `steamID64`";
		}else if(response[0] == '<') {
			return "Error - Unknown issue";
		}else{
			let data = JSON.parse(response);
			let stats = data.playerstats.stats;
			let responseData = {
				isValid : true,
				type : type,
				content : null
			};
			switch (type){
				case "overview":
					content = overview(stats);
					break;
				case "shipstats":
					content = shipstats(stats);
					break;
				case "shipweaponry":
					content = shipweaponry(stats);
					break;
				case "weaponstats":
					content = weaponstats(stats);
					break;
				default:
					responseData.isValid = false;
					break;
			}

			return content;
		}
	});
}

function overview(data){
	let kills = 0;
	let deaths = 0;
	let captainWins = 0;
	let captainLosses = 0;
	let score = 0;
	let prestige = 0;
	let crewHits = 0;;
	let unassigned = true;
	let faveWeap = {};

	let returnData = {
		playerStats : null,
		captainStats : null,
		faveWeapon : null
	}

	for (i=0;i<data.length;i++){

		if (weapons.indexOf(stats[i].name) !== -1){
			if (unassigned){
				faveWeap = stats[i];
				unassigned = false;
			}else{
				if (faveWeap.value < stats[i].value){
					faveWeap = stats[i];
				}
			}
		}

		switch(data[i].name){
			case "acc_kills":
				kills = data[i].value;
				break;
			case "acc_deaths":
				deaths = data[i].value;
				break;
			case "acc_capWins":
				captainWins = data[i].value;
				break;
			case "acc_capLose":
				captainLosses = data[i].value;
				break;
			case "stat_score":
				score = data[i].value;
				break;
			case "stat_pres":
				prestige = data[i].value;
				break;
			case "acc_capHit":
				crewHits = data[i].value;
				break;
			default:
				break;
		}
	}

	returnData.playerStats = `${kills} kills\n${deaths} deaths\n KD of ${kills/deaths}\nScore: ${score}\nLevel: (${prestige}) ${level}`;
	returnData.captainStats = `${captainWins} wins\n${captainLosses} losses\nRatio: ${captainWins/captainLosses}\nCrew Hits: ${crewHits}`;
	returnData.faveWeapon = faveWeapon;
	return returnData;
}

function shipstats(data){
	let shipStats = [];

	for (i=0;i<data.length;i++){
		if (ships.indexOf(stats[i].name) !== -1){
			shipStats.push(stats[i]);
		}
	}

	let ShipStats = WeaponTextGenerator(WeaponSorter(shipStats),subShipNames,ships,"wins",true);
	let untrackedWins = parseInt(captainWins) - parseInt(ShipStats.split("Total: ")[1]);
	let returnData = {
		ships : `${ShipStats}`,
		general : `Wins: ${captainWins}\n - Untracked: ${untrackedWins}\nLosses: ${captainLosses}\nWin Rate: ${captainWins/captainLosses}`
	}
	return returnData;
}

function shipweaponry(data){
	let allShipWeaponry = [];

	for (i=0;i<data.length;i++){
		if (weapons.indexOf(stats[i].name) !== -1){
			allShipWeaponry.push(stats[i]);
		}
	}

	let weaponData = WeaponTextGenerator(WeaponSorter(allShipWeaponry),substituteNames,weapons,"kills",true);
	return weaponData;
}

function weaponstats(data){
	let allWeaponStats = [];

	for (i=0;i<data.length;i++){
		if (weapons.indexOf(stats[i].name) !== -1){
			allWeaponStats.push(stats[i]);
		}
	}

	let weaponData = WeaponTextGenerator(WeaponSorter(allWeaponStats),substituteNames,weapons,"kills",true);
	return weaponData;
}

function levelProgress(score, prestige){
	score = scoreAdjustPrestige(score, prestige);
	for (let i = 0; i < 2000; i++)
	{
		if (score <= i * i * 72)
		{
			return i;
		}
	}
}

function scoreAdjustPrestige(score, prestige){
	score -= prestige * 172873;
	if (prestige != 10)
	{
		score = Math.min(score, 172873);
	}
	return score;
}

function WeaponSorter(weaponsArray){
	for (i=0;i < weaponsArray.length;i++){
		for (s=0;s < weaponsArray.length;s++){
			if (weaponsArray[i].value > weaponsArray[s].value){
				let tempVar = weaponsArray[i];
				weaponsArray[i] = weaponsArray[s];
				weaponsArray[s] = tempVar;
			}
		}
	}
	return weaponsArray;
}

function WeaponTextGenerator(weaponsArray,substituteNames,weapons,type,enableTotal){
	let returnMsg = "";
	let count = 0;
	for (i=0; i < weaponsArray.length;i++){
		if (weapons.indexOf(weaponsArray[i].name) != -1)
		{
			returnMsg = returnMsg + `${substituteNames[weapons.indexOf(weaponsArray[i].name)]} - ${weaponsArray[i].value} ${type}\n`;
			count += weaponsArray[i].value;
		}
	}
	if (enableTotal){
		returnMsg += `Total: ${count}`;
	}
	return returnMsg;
}