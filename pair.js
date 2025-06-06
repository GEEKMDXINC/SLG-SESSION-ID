// ici c'est le code pair 

const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require("child_process");
let app = express.Router()
const pino = require("pino");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    jidNormalizedUser
} = require("@whiskeysockets/baileys");
const { upload } = require('./mega');

const sessionDir = path.join(__dirname, './session');

app.get('/', async (req, res) => {
    let num = req.query.number;
    async function slgpairfonction() {

if(!fs.existsSync(sessionDir)){
fs.mkdirSync(sessionDir)
};
        const { state, saveCreds } = await useMultiFileAuthState(`./session`);
        try {
            let slg = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: Browsers.macOS("Safari"),
            });

            if (!slg.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await slg.requestPairingCode(num);
                if (!res.headersSent) {
                    await res.send({ code });
                }
            }

            slg.ev.on('creds.update', saveCreds);
            slg.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;
                if (connection === "open") {
                    try {
                        await delay(10000);
                        const sessionPrabath = fs.readFileSync(`${sessionDir}/creds.json`);

                        const auth_path = './session/';
                        const user_jid = jidNormalizedUser(slg.user.id);

                      function randomMegaId(length = 6, numberLength = 4) {
                      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                      let result = '';
                      for (let i = 0; i < length; i++) {
                      result += characters.charAt(Math.floor(Math.random() * characters.length));
                        }
                       const number = Math.floor(Math.random() * Math.pow(10, numberLength));
                        return `${result}${number}`;
                        }

                        const mega_url = await upload(fs.createReadStream(auth_path + 'creds.json'), `${randomMegaId()}.json`);

                        const string_session = mega_url.replace('https://mega.nz/file/', '');

                        const sid = string_session;

                        const dt = await slg.sendMessage(slg.user.id, {
                            text: sid
                        });

                    } catch (e) {
                        exec('pm2 restart slg');
                    }

                    await delay(100);
                    return await fs.rmSync(sessionDir,{récursive: true, force: true});
                    process.exit(0);
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
                    await delay(10000);
                    slgpairfonction();
                }
            });
        } catch (err) {
            exec('pm2 restart slg-md');
            console.log("service restarted");
            slgpairfonction();
            await fs.rmSync(sessionDir,{récursive: true, force: true});
            if (!res.headersSent) {
                await res.send({ code: "Service indisponible" });
            }
        }
    }
    return await slgpairfonction();
});

process.on('uncaughtException', function (err) {
    console.log('Caught exception: ' + err);
    exec('pm2 restart pair');
});


module.exports = app;
