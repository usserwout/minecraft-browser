# Minecraft browser

Minecraft browser can open a fully functional internet browser inside your minecraft world


## Installation

Minecraft browser requires [Node.js](https://nodejs.org/) v10+ to run.

Install the dependencies.

```sh
cd minecraft-browser
npm i
```

Join your minecraft world and start a LAN:
![](https://i.ibb.co/ggJnnGC/Schermafbeelding-2021-09-06-om-15-36-52.png)

Open the settings.json file and change the port to the correct LAN port.

Lastly start the bot.
```sh
npm start
```

## Commands

Here are the commands 

| Command |  |
| ------ | ------ |
| google <url / string> | searches in top search bar |
| back | go back to previous page |
| update | rerenders the screen |
| scroll <up / down / left / right / bottom / top> <number (optional)> | page scrolling |
| type <string> | types string in current focussed input |
| key <enter / backspace> | presses either enter or backspace |
| reload | reloads the page |
| view <small | normal | large> | changes the view of the browser |
| tp | bot tps to you |
| stop | quit script |


