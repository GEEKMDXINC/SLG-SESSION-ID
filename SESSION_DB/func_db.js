const { Sequelize, DataTypes } = require('sequelize');

let sequelize;

const db = "postgresql://slg_session_user:4MPydHKPKz1rhqVYoxehFGvJmM5HL6qu@dpg-d1e28lvgi27c7386629g-a.oregon-postgres.render.com/slg_session"


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

module.exports = { Session };