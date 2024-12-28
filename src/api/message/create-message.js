//it will create a message


import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';
import { Op } from 'sequelize';
import io from '../..';
import { onlineUsers } from '../../randomConnLogic';
import { on } from 'nodemon';


let controller = async (req, res, next)=>{
    const {chatId, content, identityKey} = req.body;
    const sentBy = req.user.id;
    
    try{
        const message = await db.Message.create({
            chatId, content, sentBy
        })
        io.to(chatId).emit('message', { 
            userId: req.user.id, 
            content,
            chatId,
            createdAt: message.createdAt
        });
        await db.Chat.update({
            lastMessageId: message.id
        }, {
            where: {
                id: chatId
            }
        });    
        await db.ChatUser.update(
            {
                newMessageCount: db.Sequelize.literal('newMessageCount + 1'),
            },
            {
                where: {
                    chatId,
                    userId: {
                        [Op.and]: [
                            { [Op.notIn]: Object.keys(onlineUsers) }, // Exclude online users
                            { [Op.ne]: req.user.id } // Exclude current user
                        ]
                    }
                }
            }
        );        
        
        
        res.status(201).json({
            success: true,
            messages: 'Message created successfully',
            identityKey,
            createdAt: message.createdAt,
        });
    }catch(error){
        next(error);
    }
}

const apiRouter = express.Router();
apiRouter.route('/').post(jwtStrategy, controller);
export default apiRouter;

