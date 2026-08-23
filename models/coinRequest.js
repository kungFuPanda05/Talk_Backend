'use strict'

module.exports = (sequelize, DataTypes) => {
    const Coin_Request = sequelize.define('Coin_Request', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        requestedCoins: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 100
            }
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            allowNull: false,
            defaultValue: 'pending'
        },
        reviewedBy: DataTypes.INTEGER,
        reviewedAt: DataTypes.DATE,
        adminNote: DataTypes.STRING
    }, {
        timestamps: true,
        indexes: [
            { fields: ['userId', 'status'] },
            { fields: ['createdAt'] }
        ]
    });

    Coin_Request.associate = function (models) {
        models.Coin_Request.belongsTo(models.User, { as: 'Requester', foreignKey: 'userId' });
        models.Coin_Request.belongsTo(models.User, { as: 'Reviewer', foreignKey: 'reviewedBy' });
    };

    return Coin_Request;
};
