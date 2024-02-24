'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
       // Define association with Event model
      //  User.belongsToMany(models.Event, {
      //   through: 'Addevents', 
      //   foreignKey: 'userId', 
      // });
    }
    static addUser({firstname,lastname,email,password}){
      return this.create({
        firstName:firstname,
        lastName: lastname,
        email: email,
        password:password
      })
    }
  }
  User.init({
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};