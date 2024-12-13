'use strict'

import crypto from 'crypto'
import bcrypt from 'bcrypt';

module.exports = (sequelize, DataTypes)=>{
    const User_Package = sequelize.define('User_Package', {
        userId: DataTypes.INTEGER,
        packageId: DataTypes.INTEGER,
        expiredAt: DataTypes.DATE
    },{
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                unique: true,
                fields: ['packageId', 'expiredAt'], // Composite unique constraint
            },
        ],
    })

    User_Package.associate = function (models){

        models.User_Package.belongsTo(models.User, { foreignKey: 'userId' });
        models.User_Package.belongsTo(models.Package, { foreignKey: 'packageId' });
    }
    return User_Package;
}
