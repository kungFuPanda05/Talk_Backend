'use strict'

import crypto from 'crypto'
import bcrypt from 'bcrypt';

module.exports = (sequelize, DataTypes)=>{
    const User = sequelize.define('User', {
        name: DataTypes.STRING,
        email: {
            type: DataTypes.STRING,
            allowNull: false, // Ensures email is required
            unique: true, // Enforces uniqueness at the ORM level
        },
        password: DataTypes.STRING,
        isAdmin: DataTypes.BOOLEAN,
        pic: DataTypes.STRING,
        gender: DataTypes.ENUM('M', 'F'),
        Online: DataTypes.INTEGER
    },{
        timestamps: true,
        paranoid: true
    })
    User.beforeCreate((user, options)=>{
        if(user.password){
            let newHashPassword = bcrypt.hashSync(user.password, 10);
            user.password = newHashPassword;
        }
    })
    User.associate = function (models){
        models.User.hasMany(models.ChatUser, {foreignKey: 'userId'});
        models.User.hasMany(models.Chat, {foreignKey: 'groupAdmin'});
        models.User.hasMany(models.ReadMessUser, {foreignKey: 'userId'});
        models.User.hasMany(models.Message, {foreignKey: 'sentBy'});
        models.User.hasMany(models.Friend_Request, { as: 'SentRequests', foreignKey: 'from' });
        models.User.hasMany(models.Friend_Request, { as: 'ReceivedRequests', foreignKey: 'to' });
        models.User.hasMany(models.Report, { as: 'From', foreignKey: 'from' });
        models.User.hasMany(models.Report, { as: 'To', foreignKey: 'to' });
        models.User.hasMany(models.User_Package, {foreignKey: "userId"});
        

        models.User.belongsToMany(models.Chat, { through: models.ChatUser, foreignKey: "userId" });
    }
    return User;
}
