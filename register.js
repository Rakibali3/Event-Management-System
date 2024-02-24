// db.js

const { Sequelize, DataTypes, Model } = require('sequelize');
const { sequelize } = require('./connectDB.js');

class DB extends Model {}

DB.init(
    {
        firstName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false
        },
        phoneNo: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        Branch: {
            type: DataTypes.STRING,
            allowNull: false
        },
        Year: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        UserId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
    },
    {
        sequelize,
        modelName: 'Event',
        tableName: 'Register' // Corrected the table name
    }
);

module.exports = DB;
DB.sync();
