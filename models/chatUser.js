'use strict'

import crypto from 'crypto'
import bcypt from 'bcrypt';

module.exports = (sequelize, DataTypes)=>{
    const ChatUser = sequelize.define('ChatUser', {
        chatId: DataTypes.UUID,
        userId: DataTypes.UUID
        
    },{
        timestamps: true,
    })
    ChatUser.beforeCreate((chatUser, options)=>{
        if(!chatUser.id) chatUser.id = crypto.randomUUID();
    })
    
    ChatUser.associate = function (models){
        models.ChatUser.belongsTo(models.Chat, {foreignKey: 'chatId'});
        models.ChatUser.belongsTo(models.User, {foreignKey: 'userId'});
    }
    return ChatUser;
}
