'use strict'

import crypto from 'crypto'

module.exports = (sequelize, DataTypes)=>{
    const Chat = sequelize.define('Chat', {
        chatName: DataTypes.STRING,
        isGroupChat: DataTypes.BOOLEAN,
        groupAdmin: DataTypes.INTEGER,
        lastMessageId: DataTypes.INTEGER,
        avatar: DataTypes.STRING,
    },{
        timestamps: true,
        paranoid: true
    })

    
    Chat.associate = function (models){
        models.Chat.hasMany(models.ChatUser, {foreignKey: 'chatId'});
        models.Chat.hasMany(models.Message, {as: "Messages", foreignKey: 'chatId'});

        models.Chat.belongsTo(models.User, {foreignKey: 'groupAdmin'});
        models.Chat.belongsTo(models.Message, {as: "Last_Message", foreignKey: 'lastMessageId'})
        models.Chat.belongsToMany(models.User, { through: models.ChatUser, foreignKey: "chatId" });
    }
    return Chat;
}
