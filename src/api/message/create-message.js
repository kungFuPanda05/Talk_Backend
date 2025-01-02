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
import { createMessage } from '../../service';

const validator = Joi.object({
    chatId: Joi.number().integer().required(), 
    content: Joi.string().required(),   
    identityKey: Joi.string().required(),   
});


let controller = async (req, res, next)=>{
    const {chatId, content, identityKey} = req.body;
    
    try{
        let createdAt = Date.now();
        io.to(chatId).emit('message', { 
            userId: req.user.id, 
            content,
            chatId,
            createdAt
        });
        let chat = await db.Chat.findOne({
            attributes: ['isGroupChat', 'chatName'],
            where: {
                id: chatId
            }
        });
        if(!chat) throw new RequestError("Invalid ChatId", 400);
        if(!chat.isGroupChat){
            let [selfId, friendId] = chat.chatName.split('_');
            if(friendId==req.user.id){
                let temp = selfId;
                selfId = friendId;
                friendId = temp;
            }

            const [isBlockedByYou, isBlocked] = await Promise.all([
                db.Friend_Request.count({ where: { from: req.user.id, to: friendId, status: "blocked" } }),
                db.Friend_Request.count({ where: { from: friendId, to: req.user.id, status: "blocked" } }),
            ]);
            if (isBlockedByYou) throw new RequestError("You had blocked this user, to send the message unblock", 409);
            if (isBlocked) throw new RequestError("The other user has blocked you");
        }

        const message = await db.Message.create({
            chatId, content, sentBy: req.user.id, createdAt, updatedAt: createdAt
        })
        
        db.Chat.update({
            lastMessageId: message.id
        }, {
            where: {
                id: chatId
            }
        }).catch(err => console.log("Error occured while updating chat from chatId: ", chatId, err));    
        db.ChatUser.update(
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
        ).catch(err => console.log("Error occured while updating chatUser for chatId: ", chatId, err));    
        // createMessage(req, chatId, content, createdAt);
        
        res.status(200).json({
            success: true,
            messages: 'Message created successfully',
            identityKey,
            createdAt,
        });
    }catch(error){
        next(error);
    }
}

const apiRouter = express.Router();
apiRouter.route('/').post(validateBody(validator), jwtStrategy, controller);
export default apiRouter;

