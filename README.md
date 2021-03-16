Simple npm package to allow easier usage to blackwake commands.

## Install

```text
npm install @cheesenibbles123/blackwakehandler
```

## Usage

```js
const bw = require('@cheesenibbles123/blackwakehandler');
bw.init(/*Your steamAPI key here*/);
let data = await bw.handler('type','steamID64');
```

## Types

- Overview
- WeaponStats
- ShipStats
- ShipWeaponry

## Response Format

```js
{
	isvalid : true/false,
	type : type,
	content : {}
}
```

Example Response

```js
{
	isValid : true,
	type : 'overview',
	content: {
    	playerStats: '60904 kills\n' +
    	  '18725 deaths\n' +
    	  'KD of 3.252550066755674\n' +
    	  'Score: 53463365\n' +
    	  'Level: (10) 848',
    	captainStats: '1824 wins\n683 losses\nRatio: 2.670571010248902\nCrew Hits: 100342',
    	faveWeapon: { name: 'acc_nock', value: 7146 }
  	}
}
```

## Example Usage

```js
const bw = require('@cheesenibbles123/blackwakehandler');

client.on('ready', () => {
	bw.init(config.steamAPIKey);
});

client.on('message', (message) => {
	let data = bw.handler('overview', message.content);
	message.channel.send(data.content);
});
````
