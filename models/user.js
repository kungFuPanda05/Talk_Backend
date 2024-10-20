'use strict'

import crypto from 'crypto'
import bcypt from 'bcrypt';

module.exports = (sequelize, DataTypes)=>{
    const User = sequelize.define('User', {
        name: DataTypes.STRING,
        email: DataTypes.STRING,
        password: DataTypes.STRING,
        isAdmin: DataTypes.BOOLEAN,
        pic: DataTypes.STRING,
        gender: DataTypes.BOOLEAN
    },{
        timestamps: true,
    })
    User.beforeCreate((user, options)=>{
        if(!user.id) user.id = crypto.randomUUID();
        if(user.password){
            let newHashPassword = bcypt.hashSync(user.password, 10);
            user.password = newHashPassword;
        }
    })
    User.associate = function (models){
        models.User.hasMany(models.ChatUser, {foreignKey: 'userId'});
        models.User.hasMany(models.Chat, {foreignKey: 'groupAdmin'});
        models.User.hasMany(models.ReadMessUser, {foreignKey: 'userId'});
        models.User.hasMany(models.Message, {foreignKey: 'sentBy'});
    }
    return User;
}
