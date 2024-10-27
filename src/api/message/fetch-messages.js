//It gives me messages corresponding to a chat

import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';



let controller = async (req, res, next)=>{
    const {chatId} = req.params;
    try{
        const messages = await db.Message.findAll({
            attributes: ['id', 'content', ['sentBy', 'userId']],
            where: { chatId }
        });
        await db.Chat.update({
            newMessageCount: 0
        }, {
            where: {
                id: chatId
            }
        })
        

        res.status(200).json({
            result: messages,
            success: true,
            messages: 'Messages list retrieved successfully'
        });
    }catch(error){
        next(error);
    }
}

const apiRouter = express.Router();
apiRouter.route('/:chatId').get(jwtStrategy, controller);
export default apiRouter;

