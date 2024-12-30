//it will create a message


import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';
import { Op } from 'sequelize';
import Joi from 'joi';
import { validateBody } from '../../middleware/validator';

const validator = Joi.object({
    chatId: Joi.number().integer().required(), 
    userId: Joi.number().integer().required(), 
});


let controller = async (req, res, next)=>{
    const {chatId, userId} = req.body;
    
    try{ 
        await db.ChatUser.update({
            newMessageCount: db.Sequelize.literal('newMessageCount + 1'),
        }, {
            where: {
                chatId,
                userId
            }
        })    
        
        res.status(200).json({
            success: true,
            messages: 'New message count updated successfully'
        });
    }catch(error){
        next(error);
    }
}

const apiRouter = express.Router();
apiRouter.route('/').post(validateBody(validator), jwtStrategy, controller);
export default apiRouter;

