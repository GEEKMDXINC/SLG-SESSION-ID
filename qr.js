// ici c'est le qr



const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require("child_process");
let app = express.Router();
const pino = require("pino");
const { toDataURL } = require('qrcode');
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
    async function slgqrfonction() {
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir);
        }

        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
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

            const qrOptions = {
                width: req.query.width || 270,
                height: req.query.height || 270,
                color: {
                    dark: req.query.darkColor || '#000000',
                    light: req.query.lightColor || '#ffffff'
                }
            };

            slg.ev.on('creds.update', saveCreds);

            slg.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    try {
                        const qrDataURL = await toDataURL(qr, qrOptions);
                        const data = qrDataURL.split(',')[1];
                        if (!res.headersSent) {
                            res.send(data);
                        }
                    } catch (err) {
                        console.error('Erreur lors de la génération du QR code :', err);
                        if (!res.headersSent) {
                            res.status(500).send('Erreur lors de la génération du QR code');
                        }
                    }
                }

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

                        await slg.sendMessage(slg.user.id, {
                            text: sid
                        });

                    } catch (e) {
                        exec('pm2 restart slg');
                    }

                    await delay(100);
                    fs.rmSync(sessionDir, { recursive: true, force: true });
                    process.exit(0);
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
                    await delay(10000);
                    slgqrfonction();
                }
            });
        } catch (err) {
            exec('pm2 restart slg-md');
            console.log("service restarted");
            slgpairfonction();
            fs.rmSync(sessionDir, { recursive: true, force: true });
            if (!res.headersSent) {
                res.send({ code: "Service indisponible" });
            }
        }
    }
    return await slgqrfonction();
});

process.on('uncaughtException', function (err) {
    console.log('Caught exception: ' + err);
    exec('pm2 restart pair');
});

module.exports = app;
