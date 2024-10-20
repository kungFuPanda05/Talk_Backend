'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('ChatUsers', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4()
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: true,
        references:{
          model: 'Users',
          key: 'id',
        },
          onUpdate: 'CASCADE'
      },
      chatId: {
        type: Sequelize.UUID,
        allowNull: true,
        references:{
          model: 'Chats',
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
      }
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('ChatUsers');
  }
};
