console.clear();
console.log("LOADING");
const puppeteer = require("puppeteer");
const { fork } = require("child_process")
const Jimp = require('jimp');
const imgPath = __dirname + "/screenshot.jpeg";
const mc_blocks = require("./textures.json");
const settings = require("./settings.json")
const child_process = fork(__dirname + "/bot")
let pageIsLoading = false
let page;
let page_view = settings.default_view
let show_screen = true
const scale = settings.scale;
let cooldown = false;
let lastImgHash = "";


(async () => {

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { height: 600, width: 800 }, 
    args: [
      '--use-fake-ui-for-media-stream',
    ],
    ignoreDefaultArgs: ['--mute-audio'],
  });
  page = await browser.newPage();
  await page.exposeFunction("take_screenshot", ss);

  child_process.on("message", async ([eventName, data]) => {
    if (eventName === "chat") {
      let command = data.split(" ")[0].toLowerCase()
      let arg = data.split(" ").splice(1).join(" ")
      switch (command) {
        case "google":
          if (arg.startsWith("http")) page.goto(arg)
          else page.goto("https://www.google.com/search?q=" + arg)
          break;
        case "update":
          ss(true)
          break;
        case "back":
          page.goBack()
          break;
        case "type":
          page.keyboard.type(arg)
         setTimeout(ss,1000)
          break;
        case "key":
          if (arg === "enter") await page.keyboard.press(String.fromCharCode(13));
          else if (arg === "backspace") await page.keyboard.press("Backspace");
          ss()
          break;
        case "reload":
          await page.reload()
          break;
        case "view":
          page_view = arg
          await page.reload()
          break;
        case "scroll":
          let direction = arg.split(" ")[0]
          let amount = Number(arg.split(" ")[1] || undefined)

          await page.evaluate(async ([direction, amount]) => {

            const target = document.querySelector("body")
            const scrollHeight = target.scrollHeight
            const clientScroll = target.getBoundingClientRect()
            const windowHeight = window.innerHeight
            const windowWidth = window.innerHeight
            if (direction === "down") {
              if (isNaN(amount) || !amount) window.scrollTo(clientScroll.x, Math.abs(clientScroll.y - windowHeight + 100))
              else window.scrollTo(clientScroll.x, Math.abs(clientScroll.y - amount))
            } else if (direction === "top") window.scrollTo(clientScroll.x, 0)
            else if (direction === "bottom") window.scrollTo(clientScroll.x, scrollHeight)
            else if (direction === "up") {
              if (isNaN(amount)|| !amount) window.scrollTo(clientScroll.x, Math.abs(clientScroll.y + windowHeight - 100))
              else window.scrollTo(clientScroll.x, Math.abs(clientScroll.y + amount))
            } else if (direction === "right") {
              if (isNaN(amount)|| !amount) window.scrollTo(Math.abs(clientScroll.x + windowWidth - 100), clientScroll.y)
              else window.scrollTo(Math.abs(clientScroll.x + amount), clientScroll.y)
            } else if (direction === "left") {
              if (isNaN(amount)|| !amount) window.scrollTo(Math.abs(clientScroll.x - windowWidth + 100), clientScroll.y)
              else window.scrollTo(Math.abs(clientScroll.x - amount), clientScroll.y)
            }
          }, [direction, amount])
          ss()
          break;
          case "start":
            show_screen = true
            ss()
          break;
          case "stop":
           process.exit()
          break;
        
      }
    } else if (eventName === "click") {
      await page.mouse.click(data.x / scale, data.y / scale, { button: 'left' })
      ss()
    }
  })

  page.on('domcontentloaded', () => {
    evalPage()
  });

  await page.goto("https://google.com")
  await page.evaluate(() => {
    document.querySelector("#L2AGLb > div")?.click();
  });


  async function evalPage() {
    ss()
    page.evaluate(([page_view,settings]) => {
      function changeFont(element) {
        element.setAttribute("style", element.getAttribute("style") + ";font-family: Arial !important" + ";font-weight:700 !important;font-size: 105% !important;letter-spacing: 0.15em !important");
        for (var i = 0; i < element.children.length; i++) {
          changeFont(element.children[i]);
        }
      }
      if (page_view === "small") changeFont(document.getElementsByTagName("body")[0]);

      var config = { attributes: true, childList: true, subtree: true, characterData: true };
      var observer = new MutationObserver(function () {
        console.log("updating...")
        take_screenshot()
      });
      var target = document.querySelector('body');
      observer.observe(target, config);
      video_playing()
      
      function video_playing(){
        if(!document) return setTimeout(video_playing,3000)
      const vids = document.getElementsByTagName("video")
      if(!vids.length) return setTimeout(video_playing,3000)
     

      for(vid of document.getElementsByTagName("video")){
      if(vid.currentTime > 0 && !vid.paused && !vid.ended && vid.readyState > 2){
        take_screenshot()
        break;
       }
        }
        setTimeout(video_playing,1000/settings.max_video_fps)
    }
    }, [page_view,settings])
  }

})();

async function ss(forced) {
  if (cooldown || pageIsLoading) return
  cooldown = true
  console.log("Taking screenshot...")
  setTimeout(() => cooldown = false, 1000/settings.max_fps)
  try {
 //await page.screenshot({ path: imgPath , fullPage: page_view === "large"});
  await page.screenshot({ path: imgPath , fullPage: page_view === "large",quality: 30, type: 'jpeg', });

  
  } catch (e) { console.log("screenshot error: ", e) }
  readPNG(forced);
}

function readPNG(forced) {
  Jimp.read(imgPath)
    .then(image => {
      image.scale(scale)
      let hash = image.hash()
      if(hash === lastImgHash && !forced) return console.log("Same img,",hash,lastImgHash)
      lastImgHash = hash
      let blocks = []
      image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
        let res = {}
        for (const block of mc_blocks) {
          let result = Math.abs(block.red - this.bitmap.data[idx]) + Math.abs(block.green - this.bitmap.data[idx + 1]) + Math.abs(block.blue - this.bitmap.data[idx + 2])
          if ((res.accurate ?? result + 1) > result) res = { accurate: result, ...block, x, y }
        }
        blocks.push(res)

      })
    if(show_screen)  child_process.send(["build", { blocks, height: image.bitmap.height, width: image.bitmap.width }])
    //   generatePixelartImage(image.bitmap.width,image.bitmap.height,blocks)
    });
}


function generatePixelartImage(width, height, blocks) {
  let image = new Jimp(width, height, function (err, image) {
    if (err) throw err;

    for (const block of blocks) {
      image.setPixelColor(Jimp.rgbaToInt(block.red, block.green, block.blue, 255), block.x, block.y);
    }
    image.write(__dirname + '/pixelized.png', (err) => {
      if (err) throw err;
      // process.exit()
    });
  })
}
