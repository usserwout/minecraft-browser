const mineflayer = require("mineflayer")
const Vec3 = require("vec3")
const settings = require("./settings.json")
let currentFrame = []
let metadata_frame = {}
let img_id

const bot = mineflayer.createBot({
    username: settings.username,
    port: settings.port,
    version: settings.version
})

bot.on("chat", (username, message) => {
    if (message == "Block placed]" || username === bot.username) return
    if (message === "tp") bot.chat("/tp " + username)
    else if (message === "help") {
        bot.chat("<<<< COMMANDS >>>>");
        ([ "google <url | string> -> search in top bar", "back -> go back to previous page", "update -> rerenders the screen", "scroll <up | down | left | right | bottom | top> <number (optional)>", "type <string> -> types string in current focussed input", "key <enter | backspace> -> presses either enter or backspace", "reload -> reloads the page", "view <small | normal | large> -> changes the view of the browser", "stop -> quit script", "tp -> bot tps to you"]).forEach((e) => {
            bot.chat(e)
        })
    } else {
        process.send(["chat", message])
        if(message === "stop") process.exit()

    }

})

bot.once("spawn", () => {
    bot.chat("/gamerule randomTickSpeed 0")
    process.on("message", ([eventName, data]) => {

        if (eventName === "build") {
            img_id = Math.random().toString()
            const pos = bot.player.entity.position.floored()
            const { blocks, height, width } = data
            img_width = width
            img_height = height
            if (!currentFrame.length) createBorder(width, height, pos)
            const commands = optimizer(blocks, height, width, pos)
            console.log("Commands: ", commands.length)
            for (const cmd of commands) {
                //  console.log(cmd)
                bot.chat(cmd)
            }
            currentFrame = blocks
            metadata_frame = { height, width, pos }
        }else if(eventName === "text"){
        }else if(eventName === "say") bot.chat(data)

    })
})

bot.on("blockUpdate", (b) => {
    if (!b.type) return
    let b_pos = b.position
    const block = bot.blockAt(new Vec3(b_pos.x, b_pos.y, b_pos.z))
    if (block.type) return
    const { pos, width, height } = metadata_frame
    let page_x = b_pos.x - pos.x + width / 2
    let page_y = pos.y - b_pos.y + height + 2
    if (Math.floor(b_pos.z) === Math.floor(pos.z) && page_y < height && page_y >= 0 && page_x <= width && page_x >= 0) {

        bot.chat(`/setblock ${b_pos.x} ${b_pos.y} ${b_pos.z} ${b.name} ${b.metadata}`)
        if (page_y + 1 >= height) return  //prevent falling block from simulating click
        console.log("You clicked on " + b.name + " at ", page_y + " , " + page_x)
        process.send(["click", { x: page_x, y: page_y }])
    }
})


function optimizer(blocks, height, width, pos) {
    let commands = []
    let removeExisting = []
    for (let i = 0; i < blocks.length; i++) {
        if (blocks[i]?.block !== currentFrame[i]?.block) removeExisting.push(blocks[i])
    }
    for (let i = 0; i < removeExisting.length;) {
        let startingBlock = removeExisting[i];
        if (!startingBlock) break;
        let endBlock = startingBlock
        while (removeExisting[i] && startingBlock.y === removeExisting[i].y && removeExisting[i].block === startingBlock.block && removeExisting[i].x - endBlock.x < 2) {
            endBlock = removeExisting[i]
            i++
        }
        if (startingBlock.x === endBlock.x) commands.push(`/setblock ${startingBlock.x + pos.x - width / 2} ${pos.y - startingBlock.y + height + 2} ${pos.z} ${startingBlock.block}`)
        else commands.push(`/fill ${startingBlock.x + pos.x - width / 2} ${pos.y - startingBlock.y + height + 2} ${pos.z} ${endBlock.x + pos.x - width / 2} ${pos.y - endBlock.y + height + 2} ${pos.z} ${endBlock.block}`)
    }
    return commands
}

function createBorder(width, height, pos) {
    bot.chat(`/fill ${pos.x - 1 - width / 2} ${pos.y + 2} ${pos.z + 1} ${pos.x + 1 + width / 2} ${pos.y + 2} ${pos.z - 1} coal_block`)
    bot.chat(`/fill ${pos.x - 1 - width / 2} ${pos.y + 3 + height} ${pos.z + 1} ${pos.x + 1 + width / 2} ${pos.y + 3 + height} ${pos.z - 1} coal_block`)

    bot.chat(`/fill ${pos.x - 1 - width / 2} ${pos.y + 2} ${pos.z + 1} ${pos.x - 1 - width / 2} ${pos.y + 3 + height} ${pos.z - 1} coal_block`)
    bot.chat(`/fill ${pos.x  + width / 2} ${pos.y + 2} ${pos.z + 1} ${pos.x  + width / 2} ${pos.y + 3 + height} ${pos.z - 1} coal_block`)

}