'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Chats', 'lastMessageId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Messages',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Chats', 'lastMessageId');
  },
};
