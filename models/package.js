'use strict'

import crypto from 'crypto'

module.exports = (sequelize, DataTypes) => {
    const Package = sequelize.define('Package', {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        Description: DataTypes.STRING
    }, {
        timestamps: true,
        paranoid: true
    })

    Package.associate = function (models) {
        models.Package.hasOne(models.User_Package, {foreignKey: "packageId"});
        models.Package.hasMany(models.Parameter_Package, {foreignKey: "packageId"});
    }
    return Package;
}
