'use strict'

import crypto from 'crypto'
import bcrypt from 'bcrypt';

module.exports = (sequelize, DataTypes)=>{
    const Friend_Request = sequelize.define('Friend_Request', {
        from: DataTypes.INTEGER,
        to: DataTypes.INTEGER,
        status: DataTypes.ENUM("accepted", "pending", "rejected", "blocked")
    },{
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                unique: true,
                fields: ['from', 'to'], // Composite unique constraint
            },
        ],
    })

    Friend_Request.associate = function (models){

        models.Friend_Request.belongsTo(models.User, { as: 'SentRequests', foreignKey: 'from' });
        models.Friend_Request.belongsTo(models.User, { as: 'ReceivedRequests', foreignKey: 'to' });
    }
    return Friend_Request;
}
