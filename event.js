// D:\new501\models\event.js

const { DataTypes } = require('sequelize');
const sequelize = require('./connectDB'); // Assuming connectDB.js exports the sequelize instance

const Event = sequelize.define('Event', {
  // Define your model attributes here
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  information: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  image: {
    type: DataTypes.BLOB('long'),
  },
});

module.exports = Event;
