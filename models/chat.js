'use strict'

import crypto from 'crypto'

module.exports = (sequelize, DataTypes)=>{
    const Chat = sequelize.define('Chat', {
        chatName: DataTypes.STRING,
        isGroupChat: DataTypes.BOOLEAN,
        groupAdmin: DataTypes.UUID
    },{
        timestamps: true,
    })

    Chat.beforeCreate((chat, options)=>{
        if(!chat.id) chat.id = crypto.randomUUID();
    })
    
    Chat.associate = function (models){
        models.Chat.hasMany(models.ChatUser, {foreignKey: 'chatId'});
        models.Chat.hasMany(models.Message, {foreignKey: 'chatId'});
        models.Chat.belongsTo(models.User, {foreignKey: 'groupAdmin'});
    }
    return Chat;
}
