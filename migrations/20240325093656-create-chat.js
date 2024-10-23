'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('Chats', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      chatName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      isGroupChat: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      groupAdmin: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references:{
          model: 'Users',
          key: 'id',
        },
          onUpdate: 'CASCADE'
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
    await queryInterface.dropTable('Chats');
  }
};
