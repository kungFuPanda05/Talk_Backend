//it will create a message


import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';
import { Op } from 'sequelize';


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
apiRouter.route('/').post(jwtStrategy, controller);
export default apiRouter;

