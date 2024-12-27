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
});

let controller = async (req, res, next)=>{

    try{

        const {name, Description} = req.body;
        let [record, created] = await dbFunctions.createUnique(db.Parameter, {name, Description});
        if(!created) throw new RequestError("This feature already exists", 409);
        res.status(200).json({
            success: true,
            messages: 'Feature Created Successfully',
        });
    }catch(error){
        next(error);
    }
}

const apiRouter = express.Router();
apiRouter.route('/').post(/*jwtStrategy,*/ validateBody(validator), controller);
export default apiRouter;

