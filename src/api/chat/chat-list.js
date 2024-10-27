//it gives me the chats corresponding to a user
import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';
import { Op } from 'sequelize';
import { match } from '../../functions';


let controller = async (req, res, next)=>{
    try{
        let { limit, page, search = "", userStatus, designationId } = req.query;
        limit = limit ? parseInt(limit, 10) : 10;
        const offset = page ? (parseInt(page, 10) - 1) * limit : 0;
        let chat;
        if(true){
            chat = await db.Chat.findAll({
                include: [
                    {
                        model: db.ChatUser,
                        attributes: [],
                        where: {
                            userId: req.user.id,
                        },                        
                        required: true
                    },
                    {
                        model: db.Message,
                        attributes: ['content', 'sentBy', 'createdAt'],
                        as: 'Last_Message',  
                        required: false     
                    }
                ],
                order: [[db.Sequelize.literal(`(SELECT m.createdAt FROM Messages AS m WHERE m.id = Chat.lastMessageId)`), 'DESC']],

            });
            chat = chat
            .filter((c) => match(c.chatName, search))  
            .slice(offset, offset + limit);            

        }else{
            chat = await db.Chat.findAll({
                include: [
                    {
                        model: db.ChatUser,
                        attributes: [],
                        where: {
                            userId: req.user.id,
                        },                        
                        required: true
                    },
                    {
                        model: db.Message,
                        attributes: ['content', 'sentBy', 'createdAt'],
                        as: 'Last_Message',
                        required: false      
                    }
                ],
                where: {
                    chatName: { [Op.like]: `%${search}%` }
                },
                order: [[db.Sequelize.literal(`(SELECT m.createdAt FROM Messages AS m WHERE m.id = Chat.lastMessageId)`), 'DESC']],
                limit,
                offset
            });
            

        }


        res.status(200).json({
            result: chat,
            success: true,
            messages: 'chat list retrieved successfully'
        });
    }catch(error){
        next(error);
    }
}

const apiRouter = express.Router();
apiRouter.route('/').get(jwtStrategy, controller);
export default apiRouter;

