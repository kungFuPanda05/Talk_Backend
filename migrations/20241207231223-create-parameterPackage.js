'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Parameter_Packages', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true
            },
            parameterId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Parameters',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            packageId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Packages',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
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
        await queryInterface.addConstraint('Parameter_Packages', {
            fields: ['parameterId', 'packageId'],
            type: 'unique',
            name: 'parameterId_packageId'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('Parameter_Packages');
    }
};
