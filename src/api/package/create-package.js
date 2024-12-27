//it will create a message


import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';
import { Op } from 'sequelize';
import dbFunctions from '../../dbFunctions';
import Joi from 'joi';
import { validateBody } from '../../middleware/validator';

const validator = Joi.object({
    name: Joi.string().required(),   
    Description: Joi.string().required(),  
    parameterIds: Joi.array().items(Joi.number().integer()).required(),
    duration: Joi.number().integer().required(), 
    coins: Joi.number().integer().required(), 
});

let controller = async (req, res, next)=>{
    let transaction = await db.sequelize.transaction();

    try{

        const {name, Description, parameterIds, duration, coins} = req.body;
        if(parameterIds?.length === 0) throw new RequestError("Please select atleast one feature", 400);
        let parametersCount = await db.Parameter.count({
            where: {
                id: parameterIds
            }
        });

        if(parameterIds.length> parametersCount) throw new RequestError("One or more parameterId is invalid", 400);

        let [packageRecord, created] = await dbFunctions.createUnique(db.Package, {name, Description, duration, coins}, transaction);
        if(!created) throw new RequestError("Package with same name already exists", 409);
        for(let parameterId of parameterIds){
            await dbFunctions.createUnique(db.Parameter_Package, {parameterId, packageId: packageRecord.id}, transaction);
        }

        await transaction.commit();
        res.status(200).json({
            success: true,
            messages: 'Package Created Successfully',
        });
    }catch(error){
        await transaction.rollback();
        next(error);
    }
}

const apiRouter = express.Router();
apiRouter.route('/').post(/*jwtStrategy,*/ validateBody(validator), controller);
export default apiRouter;

