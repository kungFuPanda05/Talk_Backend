//It gives me messages corresponding to a chat

import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';



let controller = async (req, res, next)=>{
    let { limit=10, page=1, search = ""} = req.query;
    console.log("Reaching to fetch messages contoller: ", limit, page, search);
    limit = limit ? parseInt(limit, 10) : 10;
    const offset = page ? (parseInt(page, 10) - 1) * limit : 0;
    const {chatId} = req.params;
    try{
        const messages = await db.Message.findAll({
            attributes: ['id', 'content', ['sentBy', 'userId'], 'createdAt'],
            where: { chatId },
            order: [['createdAt', 'DESC']],
            limit, 
            offset
        });
        await db.ChatUser.update({
            newMessageCount: 0
        }, {
            where: {
                chatId,
                userId: req.user.id
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

