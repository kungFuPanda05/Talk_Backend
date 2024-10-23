'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('ReadMessUsers', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references:{
          model: 'Users',
          key: 'id',
        },
          onUpdate: 'CASCADE'
      },
      messId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references:{
          model: 'Messages',
          key: 'id',
        },
          onUpdate: 'CASCADE'
      },
      readAt:{
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      deletedAt: {
        type: Sequelize.DATE
      }
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('ReadMessUsers');
  }
};
