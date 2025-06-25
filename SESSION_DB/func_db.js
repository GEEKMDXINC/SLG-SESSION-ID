const { Sequelize, DataTypes } = require('sequelize');
const db = process.env.DATABASE;

let sequelize;

if (!db) {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.db',
    logging: false,
  });
} else {
  sequelize = new Sequelize(db, {
    dialect: 'postgres',
    ssl: true,
    protocol: 'postgres',
    dialectOptions: {
      native: true,
      ssl: { require: true, rejectUnauthorized: false },
    },
    logging: false,
  });
}

const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
  }
}, {
  tableName: 'sessions',
  timestamps: false,
});

(async () => {
  await Session.sync();
  console.log("✅ Table 'Session' synchronisée.");
})();

const { Session } = require('./db_func');
const { Op } = require('sequelize');

function generateRandomId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

async function upload_session(content) {
  let rawId, fullId, exists;

  do {
    rawId = generateRandomId();
    fullId = `Ovl-MD_${rawId}_SESSION-ID`;
    exists = await Session.findByPk(fullId);
  } while (exists);

  await Session.create({
    id: fullId,
    content,
    createdAt: new Date(),
  });

  return fullId;
}

  const expired = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const count = await Session.destroy({
    where: {
      createdAt: { [Op.lt]: expired },
    },
  });

  console.log(`🧹 ${count} sessions supprimées (créées il y a plus de 7 jours)`);
}

setInterval(delete_old_sessions, 24 * 60 * 60 * 1000);

module.exports = { upload_session, get_session };