import crypto from 'crypto';
import socketStrategy from './strategy/auth/socketauth';
import db from '../models';
import { createMessage } from './service';
import { Op, where } from 'sequelize';
import config from '../config';
import JWT from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import botFunctions from './botFunctions';
const ioClient = require('socket.io-client');

const JWTSign = (user, date) => {
    return JWT.sign(
        {
            iss: config.app.name,
            sub: user.id,
            iat: date.getTime()
        },
        config.app.secret,
        {
            expiresIn: "30d"
        }
    );
}

let person = {
    MWM: [],
    MWF: [],
    FWF: [],
    FWM: []
}

function getOnlineUsers(io, selfGender) {
    let maleCount = 0;
    let femaleCount = 0;
    let onlineCount = 0;
    // Loop through all connected sockets
    io.sockets.sockets.forEach((socket) => {
        if (socket.user && socket.user.gender) {
            // if(!(socket.randomRoomId)){
            //     if(socket.user
            //         .gender==='M') maleCount++;
            //     else femaleCount++;
            // } 
            onlineCount++;
        }
    });
    if (selfGender === "M") return person.MWM.length <= person.MWF.length ? "M" : "F";
    else return person.FWM.length <= person.FWF.length ? "M" : "F";

}
let femaleBots = [];
let maleBots = [];
let isBot = {};
let isBotsLoaded = false;
let loadBotAccounts = async () => {
    if (isBotsLoaded) return;
    try {
        let botAccounts = await db.User.findAll({
            attributes: ['id', 'gender', 'coins', 'Online', 'name'],
            where: {
                email: {
                    [Op.like]: '%@bot.com'
                }
            }
        });
        botAccounts = JSON.parse(JSON.stringify(botAccounts));
        for (let bot of botAccounts) {
            isBot[bot.id] = true;
        }

        femaleBots = botAccounts.filter(bot => bot.gender === 'F');
        maleBots = botAccounts.filter(bot => bot.gender === 'M');
        isBotsLoaded = true;

        console.log(`Loaded ${femaleBots.length} female bots and ${maleBots.length} male bots.`);
    } catch (error) {
        console.error('Error loading bot accounts:', error);
    }
};

let connectBot = async (io, reverseWanthave, randomRoomId) => {
    await loadBotAccounts();
    if (person[reverseWanthave].includes(randomRoomId)) {
        let bot;
        let strangerGender = reverseWanthave[2];
        if (strangerGender === 'F') {
            if (femaleBots.length > 0) {
                bot = femaleBots[0];
                femaleBots.shift();
                console.log("Female bot is fired to be connect to user");
            } else {
                console.log("No female bots left");
                return;
            }
        } else {
            if (maleBots.length > 0) {
                bot = maleBots[0];
                maleBots.shift();
                console.log("Male bot is fired to be connect to user");
            } else {
                console.log("No male bots left");
                return;
            }
        }
        const token = JWTSign(bot, new Date());
        let botClientSocket;
        if (!onlineUsers[bot.id]) {
            botClientSocket = ioClient(process.env.BACKEND_URL, {
                extraHeaders: {
                    Authorization: `Bearer ${token}` // Pass JWT token here
                }
            });
            // onlineUsers[bot.id] = botClientSocket.id;
            botClientSocket.on('connect', async () => {
                console.log(`Bot ${bot.id} connected to the server`);
                botClientSocket.on('user-left', async (data) => {
                    console.log("The bot with id: ", bot.id, " leaving the room");
                    botClientSocket.emit('leave-room');
                    const botSocketId = onlineUsers[bot.id];
                    const botSocket = io.sockets.sockets.get(botSocketId);
                    await botFunctions.clearBotReplies(botSocket.randomRoomId);
                });
                botClientSocket.on('strangers-connected', async (res) => {
                    let users = res.users;
                    let stranger = users.find(user => user.id !== bot.id);
                    await botFunctions.botInit(bot.gender, stranger.gender, res.roomId);
                })
                botClientSocket.on('message', async (message) => {
                    const identityKey = uuidv4();
                    if (message.userId != bot.id) {
                        let user = await db.User.findOne({
                            attributes: ['id', 'gender', 'name'],
                            where: {
                                id: message.userId
                            }
                        });
                        botClientSocket.emit('typing', { chatId: message.chatId, isTyping: true });
                        let reply = await botFunctions.botReply(message.content, bot.gender, user.gender, (message.randomRoomId || message.chatId), bot.name);
                        botClientSocket.emit('typing', { chatId: message.chatId, isTyping: false });
                        botClientSocket.emit("message", { messageContent: reply, chatId: message.chatId, identityKey });
                    }
                })
            })
        } else botClientSocket = io.sockets.sockets.get(onlineUsers[bot.id]);
        if (botClientSocket) {
            botClientSocket.emit('join-room', { gwant: reverseWanthave[0] });
            // console.log(`Bot ${bot.id} joined room ${randomRoomId}`);
        }
        // person[reverseWanthave] = person[reverseWanthave].filter(roomId => roomId !== randomRoomId);
    }
}


export let onlineUsers = {};

let randomConnect = (io) => {
    try {
        io.on("connection", (socket) => {
            console.log("The socket connection has been established");
            onlineUsers[socket.user.id] = socket.id;
            db.User.update(
                {
                    Online: db.sequelize.literal('Online + 1'), // Correct syntax
                },
                {
                    where: {
                        id: socket.user.id, // Ensure `socket.user.id` exists and is valid
                    },
                }
            );
            console.log("User with id: ", socket.user.id, " online count increased");
            let ghave = socket.user.gender;
            let randomRoomId;
            db.ChatUser.findAll({
                attributes: ['chatId'],
                where: {
                    userId: socket.user.id
                }
            }).then(async (chats) => {
                for (let chat of chats) {
                    const chatDetails = await db.Chat.findOne({
                        attributes: ['chatName', 'isGroupChat'],
                        where: { id: chat.chatId }
                    });

                    if (!chatDetails) {
                        throw new RequestError(`Chat not found for chatId: ${chat.chatId}`);
                    }

                    if (!chatDetails.isGroupChat) {

                        const [selfId, friendId] = chatDetails.chatName.split('_');
                        if (!selfId || !friendId) {
                            throw new RequestError(`Invalid chatName format: ${chatDetails.chatName}`);
                        }

                        const isBlocked = await db.Friend_Request.count({
                            where: {
                                status: "blocked",
                                [Op.or]: [
                                    { from: selfId, to: friendId },
                                    { from: friendId, to: selfId }
                                ]
                            }
                        });

                        if (!isBlocked) {
                            console.log("socket joining to chatId: ", chat.chatId);
                            socket.join(chat.chatId);
                        }
                    } else {
                        socket.join(chat.chatId);
                    }
                }

            }).catch(error => {
                console.log("Unable to connect normal chats with socket: ", error);
            });
            io.emit('online', socket.user.id);
            socket.on('join-room', async ({ gwant }) => {
                try {
                    console.log("Request received for assigning to random room, gwant: ", gwant, " ghave: ", ghave);
                    if (gwant === "M" || gwant === 'F') {
                        socket.hasPreference = true;
                        let user = await db.User.findOne({
                            attributes: ['coins'],
                            where: {
                                id: socket.user.id
                            }
                        })
                        if (user.coins <= 0) throw new RequestError("You don't have sufficient coins");
                    } else {
                        gwant = getOnlineUsers(io, socket.user.gender);
                    }
                    let wantHave = gwant + 'W' + ghave;
                    let revereseWantHave = ghave + 'W' + gwant;
                    console.log("\x1b[33m%s\x1b[0m", "person(before):", person);
                    console.log("\x1b[34m%s\x1b[0m", "wanthave and reversewanthave:", wantHave, revereseWantHave);

                    while (person[wantHave].length > 0 && !(io.sockets?.adapter?.rooms?.get(person[wantHave][0])?.size)) person[wantHave].shift(); //clearing the rooms which doesn't exists in socket anymore
                    if (person[wantHave].length > 0) {
                        randomRoomId = person[wantHave][0];
                        person[wantHave].shift();
                    } else {
                        randomRoomId = crypto.randomUUID();
                        person[revereseWantHave].push(randomRoomId);
                        setTimeout(() => {
                            connectBot(io, revereseWantHave, randomRoomId);
                        }, 5000);
                    }

                    console.log("\x1b[33m%s\x1b[0m", "person(after):", person);
                    socket.join(randomRoomId);
                    socket.randomRoomId = randomRoomId;
                    console.log("The socket randomRoomId ", randomRoomId);
                    console.log("Rooms this socket has joined", socket.rooms);

                    // setTimeout(() => {
                    const usersInRoom = io.sockets.adapter.rooms.get(socket.randomRoomId);
                    console.log("The users in random room: ", usersInRoom.size);
                    if (usersInRoom && usersInRoom.size === 2) {
                        // Notify both users in the room that they are connected
                        const users = [];

                        usersInRoom.forEach(async (socketId) => {
                            const userSocket = io.sockets.sockets.get(socketId); // Get the socket instance
                            if (userSocket && userSocket.user && userSocket.user.id) {
                                users.push(userSocket.user); // Access socket.user.id and store it
                                if (userSocket.hasPreference) {
                                    await db.User.update({
                                        coins: db.Sequelize.literal(`coins-10`)
                                    }, {
                                        where: {
                                            id: userSocket.user.id
                                        }
                                    })
                                }
                            }

                        });
                        console.log("The room with id: ", socket.randomRoomId, " gets filled with users : ", users);
                        io.to(socket.randomRoomId).emit('strangers-connected', { success: true, message: "Connected to Stranger", users, roomId: socket.randomRoomId });

                    }
                    // }, 100);

                } catch (error) {
                    console.log("Error in assigning a random room: ", error);
                    socket.emit('error', {
                        response: {
                            data: {
                                success: false,
                                messages: error.errorList
                            }
                        }
                    });
                }
            });
            socket.on('leave-room', () => {
                socket.leave(socket.randomRoomId);
                io.to(socket.randomRoomId).emit('user-left', "Stranger left the chat");
            })

            socket.on('message', async (message) => {
                try {
                    if (message.chatId != 0) {
                        console.log("the message is received and sent to the chat: ", message);
                        let createdAt = new Date();
                        io.to(message.chatId).emit('message', { userId: socket.user.id, content: message.messageContent, chatId: message.chatId, identityKey: message.identityKey, createdAt });
                        createMessage(socket, message.chatId, message.messageContent, createdAt);
                    } else {
                        console.log("the message is received and sent to the random-room: ", socket.randomRoomId, message.messageContent);
                        io.to(socket.randomRoomId).emit('message', { userId: socket.user.id, content: message.messageContent, randomRoomId: socket.randomRoomId, chatId: 0, createdAt: new Date(), identityKey: message.identityKey });
                    }

                } catch (error) {
                    console.log("Error occured while sending the message: ", error);
                    if (!(error instanceof RequestError)) {
                        error = new RequestError("Unable to send the message", error.message);
                    }
                    socket.emit('error', {
                        response: {
                            data: {
                                success: false,
                                messages: error.errorList
                            }
                        }
                    });
                }
            })

            socket.on('send-request', () => {
                socket.to(socket.randomRoomId).emit('receive-request', true);
            });
            // socket.on('send-request-accept', () =>{
            //     socket.to(socket.randomRoomId).emit('receive-request-accept', true);
            // });
            socket.on('send-request-accept-later', (friendId) => {
                // Find the socket ID of the friend
                const friendSocketId = onlineUsers[friendId];
                console.log("reached to send-request-accept-friend", friendSocketId);

                if (friendSocketId) {
                    // Emit the message to the specific friend
                    io.to(friendSocketId).emit(
                        'receive-request-accept-later',
                        `${socket.user.name} has accepted your friend request`
                    );
                    console.log(`Message sent to ${friendId}: ${socket.user.name} has accepted your friend request`);
                } else {
                    console.log(`User with ID ${friendId} is not online`);
                }
            });

            socket.on('typing', (res) => {
                if (res.chatId != 0) {
                    socket.to(res.chatId).emit('typing-status', res);
                } else {
                    socket.to(socket.randomRoomId).emit('typing-status', res);
                }
            })

            getOnlineUsers(io);


            socket.on('disconnect', async () => {
                console.log("The user disconnected");
                let onlineCount = await db.User.findOne({
                    attributes: ['Online'],
                    where: {
                        id: socket.user.id
                    }
                });
                if (onlineCount.Online > 0) {
                    db.User.update(
                        {
                            Online: onlineCount.Online - 1,
                        },
                        {
                            where: {
                                id: socket.user.id,
                            },
                        }
                    );

                }
                if (onlineCount.Online == 1) io.emit('offline', socket.user.id);
                io.to(socket.randomRoomId).emit('user-left', "Stranger left the chat");
                if (socket.user?.id && onlineUsers[socket.user.id]) {
                    delete onlineUsers[socket.user.id]; // Remove the user from onlineUsers map
                }

            })
        });

    } catch (error) {
        console.log("The error in socket.io is: ", error);
    }
}
export default randomConnect;