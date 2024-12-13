'use strict'

import crypto from 'crypto'

module.exports = (sequelize, DataTypes) => {
    const Parameter = sequelize.define('Parameter', {
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

    Parameter.associate = function (models) {
        models.Parameter.hasMany(models.Parameter_Package, {foreignKey: "parameterId"});
    }
    return Parameter;
}
