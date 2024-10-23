'use strict'

import crypto from 'crypto'
import bcypt from 'bcrypt';

module.exports = (sequelize, DataTypes)=>{
    const Message = sequelize.define('Message', {
        content: DataTypes.STRING,
        sentBy: DataTypes.INTEGER,
        chatId: DataTypes.INTEGER
    },{
        timestamps: true,
        paranoid: true
    })

    Message.associate = function (models){
        models.Message.hasMany(models.ReadMessUser, {foreignKey: 'messId'});
        models.Message.belongsTo(models.User, {foreignKey: 'sentBy'});
        models.Message.belongsTo(models.Chat, {foreignKey: 'chatId'});
    }
    return Message;
}
