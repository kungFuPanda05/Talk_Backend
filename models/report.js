'use strict'

import crypto from 'crypto'

module.exports = (sequelize, DataTypes)=>{
    const Report = sequelize.define('Report', {
        from: DataTypes.INTEGER,
        to: DataTypes.INTEGER,
        description: DataTypes.TEXT
    },{
        timestamps: true,
        paranoid: true
    })

    
    Report.associate = function (models){
        models.Report.belongsTo(models.User, { as: 'From', foreignKey: 'from' });
        models.Report.belongsTo(models.User, { as: 'To', foreignKey: 'to' });
    }
    return Report;
}
