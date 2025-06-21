// ici c'est pour les fonctions utiles de mégas 
const Storage = require("megajs");

const  upload = (credsPath, nameFile) => {
    try {
        const storage = await new Storage({
            email: 'sylivanusmomanyi@gmail.com', // Your Mega A/c Email Here
            password: 'Sylivanus@42620143' // Your Mega A/c Password Here
        }).ready;
        console.log('Mega storage initialized.');

        if (!fs.existsSync(credsPath)) {
            throw new Error(`File not found: ${credsPath}`);
        }

        const fileSize = fs.statSync(credsPath).size;
        const uploadResult = await storage.upload({
            name: nameFile,
            size: fileSize
        }, fs.createReadStream(credsPath)).complete;

        console.log('Session successfully uploaded to Mega.');
        const fileNode = storage.files[uploadResult.nodeId];
        const megaUrl = await fileNode.link();
        console.log(`Session Url: ${megaUrl}`);
        return megaUrl;
    } catch (error) {
        console.error('Error uploading to Mega:', error);
        throw error;
    }
}

module.exports = { upload };