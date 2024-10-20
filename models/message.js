'use strict'

import crypto from 'crypto'
import bcypt from 'bcrypt';

module.exports = (sequelize, DataTypes)=>{
    const Message = sequelize.define('Message', {
        content: DataTypes.STRING,
        sentBy: DataTypes.UUID,
        chatId: DataTypes.UUID
    },{
        timestamps: true
    })
    Message.beforeCreate((message, options)=>{
        if(!message.id) message.id = crypto.randomUUID();
    })

    Message.associate = function (models){
        models.Message.hasMany(models.ReadMessUser, {foreignKey: 'messId'});
        models.Message.belongsTo(models.User, {foreignKey: 'sentBy'});
        models.Message.belongsTo(models.Chat, {foreignKey: 'chatId'});
    }
    return Message;
}
