'use strict'

import crypto from 'crypto'
import bcrypt from 'bcrypt';

module.exports = (sequelize, DataTypes)=>{
    const Friend_Request = sequelize.define('Friend_Request', {
        from: DataTypes.INTEGER,
        to: DataTypes.INTEGER,
        status: DataTypes.ENUM("Accepted", "Pending", "Rejected")
    },{
        timestamps: true,
        paranoid: true
    })

    Friend_Request.associate = function (models){
        models.Friend_Request.belongsTo(models.User, { as: 'fromUser', foreignKey: 'from' });
        models.Friend_Request.belongsTo(models.User, { as: 'toUser', foreignKey: 'to' });
    }
    return Friend_Request;
}
