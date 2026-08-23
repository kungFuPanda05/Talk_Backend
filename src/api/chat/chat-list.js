//it gives me the chats corresponding to a user
import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';
import { Op } from 'sequelize';
import { match } from '../../functions';


let controller = async (req, res, next)=>{
    try{
        let { limit=10, page=1, search = ""} = req.query;
        limit = Number.parseInt(limit, 10);
        page = Number.parseInt(page, 10);
        limit = Number.isInteger(limit) && limit >= 1 && limit <= 100 ? limit : 10;
        page = Number.isInteger(page) && page >= 1 ? page : 1;
        search = typeof search === 'string' ? search : '';
        const offset = (page - 1) * limit;
        let chats = await db.Chat.findAll({
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
                    attributes: [
                        [db.Sequelize.literal(`CASE WHEN type = 'image' THEN 'Photo' ELSE content END`), 'content'],
                        'sentBy',
                        'createdAt'
                    ],
                    as: 'Last_Message',
                    required: false,
                }
            ],
            order: [[db.Sequelize.literal(`(SELECT m.createdAt FROM Messages AS m WHERE m.id = Chat.lastMessageId)`), 'DESC']],
        });

        chats = await Promise.all(chats.map(async (chatRecord) => {
            const chat = chatRecord.get({ plain: true });
            chat.status = 'accepted';

            if (!chat.isGroupChat) {
                const user = await db.User.findOne({
                    attributes: ['id', 'name', 'Online', 'pic'],
                    include: [{
                        model: db.ChatUser,
                        attributes: [],
                        required: true,
                        where: {
                            chatId: chat.id
                        }
                    },{
                        model: db.Friend_Request,
                        as: 'ReceivedRequests',
                        attributes: ['status'],
                        where: {
                            from: req.user.id
                        },
                        required: false
                    }, {
                        model: db.Friend_Request,
                        as: 'SentRequests',
                        attributes: ['status'],
                        where: {
                            to: req.user.id
                        },
                        required: false
                    }],
                    where: {
                        id: {
                            [Op.ne]: req.user.id
                        }
                    }
                });

                if (!user) return null;

                chat.chatName = user.name;
                chat.avatar = user.pic;
                chat.friendId = user.id;
                chat.friendOnlineStatus = user.Online > 0;
                const isAccepted = user.ReceivedRequests?.[0]?.status === "accepted"
                    || user.SentRequests?.[0]?.status === "accepted";
                chat.status = isAccepted ? "accepted" : "rejected";
            }

            if(chat.Last_Message?.content) {
                chat.Last_Message.content = chat.Last_Message.content.length > 50
                    ? `${chat.Last_Message.content.slice(0, 50).trim()}...`
                    : chat.Last_Message.content;
            }
            chat.newMessageCount = chat.ChatUsers[0]?.newMessageCount ?? 0;
            delete chat.ChatUsers;
            return chat;
        }));

        const normalizedSearch = search.trim().toLowerCase();
        chats = chats
            .filter(Boolean)
            .filter((chat) => {
                if (chat.status !== "accepted") return false;
                if (!normalizedSearch) return true;
                const chatName = typeof chat.chatName === 'string' ? chat.chatName : '';
                if (process.env.ULTRA_SEARCH === "true") return match(chatName, search);
                return chatName.toLowerCase().includes(normalizedSearch);
            })
            .slice(offset, offset + limit);


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
