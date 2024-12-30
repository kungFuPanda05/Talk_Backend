//it will create a message


import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';
import { Op } from 'sequelize';
import io from '../..';
import { onlineUsers } from '../../randomConnLogic';
import { on } from 'nodemon';
import Joi from 'joi';
import { validateBody } from '../../middleware/validator';

const validator = Joi.object({
    chatId: Joi.number().integer().required(), 
    content: Joi.string().required(),   
    identityKey: Joi.string().required(),   
});


let controller = async (req, res, next)=>{
    const {chatId, content, identityKey} = req.body;
    const sentBy = req.user.id;
    
    try{
        let chat = await db.Chat.findOne({
            attributes: ['isGroupChat'],
            where: {
                id: chatId
            }
        });
        if(!chat) throw new RequestError("Invalid ChatId", 400);
        if(!chat.isGroupChat){
            let friend = await db.User.findOne({
                attributes: ['id'],
                include: [{
                    model: db.ChatUser,
                    attributes: [],
                    where: {
                        chatId
                    }
                }],
                where: {
                    id: {
                        [Op.ne]: req.user.id
                    }
                },
                raw: true
            });
            if (!friend) throw new RequestError("No friend found in this chat");

            let isBlockedByYou = await db.Friend_Request.count({
                where: {
                    from: req.user.id,
                    to: friend.id,
                    status: "blocked"
                }
            });
            if(isBlockedByYou) throw new RequestError("You had blocked this user, to send the message unblock", 409);
            
            let isBlocked = await db.Friend_Request.count({
                where: {
                    from: friend.id,
                    to: req.user.id,
                    status: "blocked"
                }
            });
            if(isBlocked) throw new RequestError("The other user has blocked you");
        }

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
apiRouter.route('/').post(validateBody(validator), jwtStrategy, controller);
export default apiRouter;

