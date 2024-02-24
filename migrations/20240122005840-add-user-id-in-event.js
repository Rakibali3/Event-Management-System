'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
   await queryInterface.addColumn('event','userId',{
      type:Sequelize.DataTypes.INTEGER
    })
    
    // await queryInterface.addConstraint('event',{
    //   fields:['userId'],
    //   type:'foreign key',
    //   references:{
    //     table:'Users',
    //     field:'id'
    //   }
    // await queryInterface.addConstraint('event',{
    //   fields:['userId'],
    //   type:'foreign key',
    //   references:{
    //     table:'User',
    //     field:'id'
    //   }
    // })
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Event','userId')
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
