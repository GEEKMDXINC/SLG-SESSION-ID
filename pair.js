const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require("child_process");
let app = express.Router();
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
const { getId } = require('./id');
const Id = getId();

// Correction du chemin vers sessionDir
const sessionDir = path.join(__dirname, 'session' + Id);

// Création du dossier avec l'option recursive
if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
}

app.get('/', async (req, res) => {
    let num = req.query.number;

    async function slgpairfonction() {
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

                        const auth_path = path.join(sessionDir, 'creds.json');

                        function randomMegaId(length = 6, numberLength = 4) {
                            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                            let result = '';
                            for (let i = 0; i < length; i++) {
                                result += characters.charAt(Math.floor(Math.random() * characters.length));
                            }
                            const number = Math.floor(Math.random() * Math.pow(10, numberLength));
                            return `${result}${number}`;
                        }

                                                const mega_url = await upload(fs.createReadStream(auth_path), `${randomMegaId()}.json`);
                        console.log("Envoi à méga réussi");

                        const string_session = mega_url.replace('https://mega.nz/file/', '');
                        console.log(string_session);

                        await slg.sendMessage(slg.user.id, {
                            text: string_session
                        });

                    } catch (e) {
                        console.log("Erreur méga url");
                        exec('pm2 restart slg');
                    }

                    fs.rmSync(sessionDir, { recursive: true, force: true });
                    await slg.ws.close();

                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
                    await delay(10000);
                    slgpairfonction();
                }
            });
        } catch (err) {
            exec('pm2 restart slg-md');
            console.log("Service restarted");
            slgpairfonction();
            fs.rmSync(sessionDir, { recursive: true, force: true });
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
