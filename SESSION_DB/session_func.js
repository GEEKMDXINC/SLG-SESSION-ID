const { Session } = require('./func_db');
const { Op } = require('sequelize');

function generateRandomId(length = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

async function upload(content) {
  let rawId, fullId, exists;

  do {
    rawId = generateRandomId();
    fullId = `SLG-MD_${rawId}`;
    exists = await Session.findByPk(fullId);
  } while (exists);

  await Session.create({
    id: fullId,
    content,
    createdAt: new Date(),
  });

  return fullId;
}

async function delete_old_sessions() {
  const expired = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const count = await Session.destroy({
    where: {
      createdAt: { [Op.lt]: expired },
    },
  });

  console.log(`🧹 ${count} sessions supprimées (créées il y a plus de 7 jours)`);
}

setInterval(delete_old_sessions, 24 * 60 * 60 * 1000);

module.exports = { upload, get_session };