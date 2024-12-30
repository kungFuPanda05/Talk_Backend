//It gives me messages corresponding to a chat

import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';
import { match } from '../../functions';
import { Op } from 'sequelize';

let sentenceMatch=(sentence, search)=>{
    let sentenceArray = sentence.split(' ');
    for(let word of sentenceArray){
        if(match(word, search)) return true;
    }
}

let controller = async (req, res, next)=>{
    let { limit=10, page=1, search = ""} = req.query;
    limit = limit ? parseInt(limit, 10) : 10;
    const offset = page ? (parseInt(page, 10) - 1) * limit : 0;
    const {chatId} = req.params;
    try{
        await db.ChatUser.update({
            newMessageCount: 0
        }, {
            where: {
                chatId,
                userId: req.user.id
            }
        })
        let messages;
        let totalMessages = 0;
        if(process.env.ULTRA_SEARCH==="true" && search){
            messages = await db.Message.findAll({
                attributes: ['id', 'content', ['sentBy', 'userId'], 'createdAt'],
                where: { chatId },
                order: [['createdAt', 'DESC']],
            });
            messages = messages
            .filter((message) => sentenceMatch(message.content, search));  
            totalMessages = messages.length;
            messages = messages.slice(offset, offset + limit);    
        }else{
            [messages, totalMessages] = await Promise.all([
                db.Message.findAll({
                    attributes: ['id', 'content', ['sentBy', 'userId'], 'createdAt'],
                    where: { 
                        chatId,
                        content: {
                            [Op.like]: `%${search}%`
                        }
                    },
                    order: [['createdAt', 'DESC']],
                    limit, 
                    offset
                }),
                db.Message.count({
                    where: { 
                        chatId,
                        content: {
                            [Op.like]: `%${search}%`
                        }
                    }
                })
            ]);

        }
        

        res.status(200).json({
            success: true,
            messages: 'Messages list retrieved successfully',
            result: messages,
            totalMessages
        });
    }catch(error){
        next(error);
    }
}

const apiRouter = express.Router();
apiRouter.route('/:chatId').get(jwtStrategy, controller);
export default apiRouter;

