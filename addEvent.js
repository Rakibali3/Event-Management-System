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
        userid: {
            type: DataTypes.INTEGER,
            allowNull: true, 
        },
        registered_users: {
            type: DataTypes.STRING, 
            defaultValue: '', 
        },
    },
    {
        sequelize,
        modelName: 'Event',
        tableName: 'Addevents' 
    }
);

module.exports = DB;
DB.sync();
