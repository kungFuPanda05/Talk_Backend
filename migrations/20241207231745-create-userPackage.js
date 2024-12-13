'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('User_Packages', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Users',  // Assuming a Users table exists
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            packageId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Packages',  // Assuming a Packages table exists
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            expiredAt: {
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
        });

        // Add composite unique constraint
        await queryInterface.addConstraint('User_Packages', {
            fields: ['packageId', 'expiredAt'],
            type: 'unique',
            name: 'unique_package_expiredAt'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('User_Packages');
    }
};
