'use strict'

import crypto from 'crypto'
import bcrypt from 'bcrypt';

module.exports = (sequelize, DataTypes)=>{
    const Parameter_Package = sequelize.define('Parameter_Package', {
        parameterId: DataTypes.INTEGER,
        packageId: DataTypes.INTEGER
    },{
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                unique: true,
                fields: ['parameterId', 'packageId'], // Composite unique constraint
            },
        ],
    })

    Parameter_Package.associate = function (models){

        models.Parameter_Package.belongsTo(models.Parameter, { foreignKey: 'parameterId' });
        models.Parameter_Package.belongsTo(models.Package, { foreignKey: 'packageId' });
    }
    return Parameter_Package;
}
