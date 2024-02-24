// db.js

const { Sequelize, DataTypes, Model } = require('sequelize');
const { sequelize } = require('./connectDB.js');

class DB extends Model {}

DB.init(
    {
        Name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        Email: {
            type: DataTypes.STRING,
            allowNull: false
        },
        Subject: {
            type: DataTypes.STRING,
            allowNull: false
        },
        Message: {
            type: DataTypes.STRING, 
            allowNull: false 
        },
    },
    {
        sequelize,
        modelName: 'Event',
        tableName: 'Contacts' 
    }
);

module.exports = DB;
DB.sync();
