//it will create a message


import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';


let controller = async (req, res, next)=>{
    const {chatId, content} = req.body;
    const sentBy = req.user.id;
    
    try{
        const message = await db.Message.create({
            chatId, content, sentBy
        })
        await db.Chat.update({
            lastMessageId: message.id,
            newMessageCount: db.Sequelize.literal('newMessageCount + 1')
        }, {
            where: {
                id: chatId
            }
        });        
        
        res.status(201).json({
            success: true,
            messages: 'Message created successfully',
            result: message
        });
    }catch(error){
        next(error);
    }
}

const apiRouter = express.Router();
apiRouter.route('/').post(jwtStrategy, controller);
export default apiRouter;

