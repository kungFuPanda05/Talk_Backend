'use strict'

import crypto from 'crypto'
import bcypt from 'bcrypt';

module.exports = (sequelize, DataTypes)=>{
    const ReadMessUser = sequelize.define('ReadMessUser', {
        messId: DataTypes.INTEGER,
        userId: DataTypes.INTEGER,
        readAt: DataTypes.INTEGER
    },{
        timestamps: true,
        paranoid: true
    })
    
    ReadMessUser.associate = function (models){
        models.ReadMessUser.belongsTo(models.User, {foreignKey: 'userId'});
        models.ReadMessUser.belongsTo(models.Message, {foreignKey: 'messId'});
    }
    return ReadMessUser;
}
