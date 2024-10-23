'use strict'

import crypto from 'crypto'

module.exports = (sequelize, DataTypes)=>{
    const Chat = sequelize.define('Chat', {
        chatName: DataTypes.STRING,
        isGroupChat: DataTypes.BOOLEAN,
        groupAdmin: DataTypes.INTEGER
    },{
        timestamps: true,
        paranoid: true
    })

    
    Chat.associate = function (models){
        models.Chat.hasMany(models.ChatUser, {foreignKey: 'chatId'});
        models.Chat.hasMany(models.Message, {foreignKey: 'chatId'});
        models.Chat.belongsTo(models.User, {foreignKey: 'groupAdmin'});
    }
    return Chat;
}
