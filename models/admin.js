const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Admin extends Model {
    static associate(models) {
      // define association here
    }

    static addAdmin({ firstname, lastname, email, password }) {
      return this.create({
        firstName: firstname,
        lastname: lastname,
        email: email,
        password: password,
      });
    }
  }

  Admin.init(
    {
      firstName: DataTypes.STRING,
      lastname: DataTypes.STRING,
      email: DataTypes.STRING,
      password: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'admin',
    }
  );

  return Admin;
};
