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
        Location: {
            type: DataTypes.STRING,
            allowNull: false
        },
        Date: {
            type: DataTypes.DATEONLY
        },
        Information: {
            type: DataTypes.STRING,
            allowNull: false
        },
        Image: {
            type: DataTypes.BLOB('long'),
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true, 
        },
        
    },
    {
        sequelize,
        modelName: 'Event',
        tableName: 'event' // Corrected the table name
    }
);

module.exports = DB;
DB.sync();
