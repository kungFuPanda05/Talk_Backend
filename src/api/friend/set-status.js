//it will create a message


import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';
import { Op } from 'sequelize';
import dbFunctions from '../../dbFunctions';
import io from '../..';
import { onlineUsers } from '../../randomConnLogic';


let controller = async (req, res, next) => {
    try {
        let { status, strangerId } = req.body;
        if (status) status += "ed";
        console.log("the status and strangerID is: ", status, strangerId);
        let friend_request;
        if (status === "blocked") {
            friend_request = await db.Friend_Request.findOne({
                where: {
                    from: req.user.id,
                    to: strangerId
                }
            });
            if (!friend_request) {
                friend_request = (await dbFunctions.createUnique(db.Friend_Request, {
                    status,
                    from: req.user.id,
                    to: strangerId
                }))[0];
            } else {
                friend_request = await db.Friend_Request.update({
                    status,
                }, {
                    where: {
                        from: req.user.id,
                        to: strangerId
                    }
                });
            }
        } else {
            let isBlocked = await db.Friend_Request.findOne({
                from: strangerId,
                to: req.user.id,
                where: {
                    status: 'blocked'
                }
            });
            if (isBlocked) throw new RequestError("The other user has blocked you, you can try sending a mail to them", 409);
            friend_request = await db.Friend_Request.update({
                status,
            }, {
                where: {
                    from: strangerId,
                    to: req.user.id
                }
            });

        }
        if (status === "accepted") {
            let chat = await db.Chat.create({
                chatName: req.user.id + "_" + strangerId,
            });
            await db.ChatUser.create({
                chatId: chat.id,
                userId: req.user.id
            });
            await db.ChatUser.create({
                chatId: chat.id,
                userId: strangerId
            });
            const userSocketId = onlineUsers[req.user.id];
            const strangerSocketId = onlineUsers[strangerId];

            // Add the users' sockets to the chat room
            if (userSocketId) {
                io.to(userSocketId).socketsJoin(chat.id); // Add req.user.id's socket to the room
            }
            if (strangerSocketId) {
                io.to(strangerSocketId).socketsJoin(chat.id); // Add strangerId's socket to the room
            }

            if (strangerSocketId) {
                io.to(strangerSocketId).emit('receive-request-accept', true);
                console.log(`Sent 'receive-request-accept' to stranger ID: ${strangerId}`);
            }
        }
        res.status(200).json({
            success: true,
            messages: 'Friend Request has been ' + status,
        });
    } catch (error) {
        next(error);
    }
}

const apiRouter = express.Router();
apiRouter.route('/').post(jwtStrategy, controller);
export default apiRouter;

