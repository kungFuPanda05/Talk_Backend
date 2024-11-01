//it gives me the chats corresponding to a user
import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';
import { Op } from 'sequelize';
import { match } from '../../functions';


let controller = async (req, res, next)=>{
    try{
        let { limit, page, search = ""} = req.query;
        limit = limit ? parseInt(limit, 10) : 10;
        const offset = page ? (parseInt(page, 10) - 1) * limit : 0;
        let chats;
        if(process.env.ULTRA_SEARCH=="true"){
            chats = await db.Chat.findAll({
                attributes: ['id','chatName', 'isGroupChat', 'avatar'],
                include: [
                    {
                        model: db.ChatUser,
                        attributes: ['newMessageCount'],
                        where: {
                            userId: req.user.id,
                        },                        
                        required: true
                    },
                    {
                        model: db.Message,
                        attributes: ['content', 'sentBy', 'createdAt'],
                        as: 'Last_Message',   //TO DO: Deal with the case when the last message sent is very big in length
                        required: false,    
                    }
                ],
                order: [[db.Sequelize.literal(`(SELECT m.createdAt FROM Messages AS m WHERE m.id = Chat.lastMessageId)`), 'DESC']],

            });
                   
            chats = await Promise.all(chats.map(async (chat) => {
                if (chat.isGroupChat == 0) {
                    let user = await db.User.findOne({
                        attributes: ['name'],
                        include: [{
                            model: db.ChatUser,
                            attributes: [],
                            required: true,
                            where: {
                                chatId: chat.id
                            }
                        }],
                        where: {
                            id: {
                                [Op.ne]: req.user.id
                            }
                        }
                    });
                    chat.chatName = user?.name ?? chat.chatName;
                }
                // Convert `chat` to a plain object to allow modification
                chat = chat.get({ plain: true });
                chat.newMessageCount = chat.ChatUsers[0]?.newMessageCount ?? 0;
                delete chat.ChatUsers;
                return chat;
            }));

            chats = chats
            .filter((c) => match(c.chatName, search))  
            .slice(offset, offset + limit);     
            

        }else{
            // chats = await db.Chat.findAll({
            //     include: [
            //         {
            //             model: db.ChatUser,
            //             attributes: [],
            //             where: {
            //                 userId: req.user.id,
            //             },                        
            //             required: true
            //         },
            //         {
            //             model: db.Message,
            //             attributes: ['content', 'sentBy', 'createdAt'],
            //             as: 'Last_Message',
            //             required: false      
            //         }
            //     ],
            //     where: {
            //         chatName: { [Op.like]: `%${search}%` }
            //     },
            //     order: [[db.Sequelize.literal(`(SELECT m.createdAt FROM Messages AS m WHERE m.id = Chat.lastMessageId)`), 'DESC']],
            //     limit,
            //     offset
            // });
            

        }


        res.status(200).json({
            result: chats,
            success: true,
            messages: 'chats list retrieved successfully'
        });
    }catch(error){
        next(error);
    }
}

const apiRouter = express.Router();
apiRouter.route('/').get(jwtStrategy, controller);
export default apiRouter;

