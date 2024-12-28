'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Friend_Requests', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true
            },
            from: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: "CASCADE"
            },
            to: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: "CASCADE"
            },
            status: {
                type: Sequelize.ENUM('accepted', 'pending', 'rejected', 'blocked'),
                allowNull: true,
                defaultValue: 'pending', 
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            deletedAt: {
                type: Sequelize.DATE,
                allowNull: true
            }
        });

        // Add a unique constraint on the combination of `from` and `to`
        await queryInterface.addConstraint('Friend_Requests', {
            fields: ['from', 'to'],
            type: 'unique',
            name: 'from_to' // Custom constraint name
        });
    },

    async down(queryInterface, Sequelize) {
        // Remove the unique constraint before dropping the table
        await queryInterface.removeConstraint('Friend_Requests', 'unique_friend_request');
        await queryInterface.dropTable('Friend_Requests');
    }
};
