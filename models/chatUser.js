'use strict'

import crypto from 'crypto'
import bcypt from 'bcrypt';

module.exports = (sequelize, DataTypes)=>{
    const ChatUser = sequelize.define('ChatUser', {
        chatId: DataTypes.INTEGER,
        userId: DataTypes.INTEGER,
        newMessageCount: DataTypes.INTEGER
        
    },{
        timestamps: true,
        paranoid: true
    })

    ChatUser.associate = function (models){
        models.ChatUser.belongsTo(models.Chat, {foreignKey: 'chatId'});
        models.ChatUser.belongsTo(models.User, {foreignKey: 'userId'});
    }
    return ChatUser;
}
