'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('Messages', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4()
      },
      content: {
        type: Sequelize.STRING,
      },
      sentBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references:{
          model: 'Users',
          key: 'id',
        },
          onUpdate: 'CASCADE'
      },
      chatId: {
        type: Sequelize.UUID,
        allowNull: false,
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
    await queryInterface.dropTable('Messages');
  }
};
