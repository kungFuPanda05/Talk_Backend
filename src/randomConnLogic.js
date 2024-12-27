import crypto from 'crypto';
import socketStrategy from './strategy/auth/socketauth';
import db from '../models';

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
    if(selfGender==="M") return person.MWM.length<=person.MWF.length?"M":"F";
    else return person.FWM.length<=person.FWF.length?"M":"F";

}

export let onlineUsers = [];

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
            }).then(chats => {
                for (let chat of chats) {
                    socket.join(chat.chatId);
                }
            }).catch(error => {
                console.log("Unable to connect normal chats with socket: ", error);
            });
            io.emit('online', socket.user.id);
            socket.on('join-room', async({ gwant }) => {
                try {
                    console.log("Request received for assigning to random room, gwant: ", gwant, " ghave: ", ghave);
                    if(gwant==="M" || gwant==='F') { 
                        socket.hasPreference = true;
                        let user = await db.User.findOne({
                            attributes: ['coins'],
                            where: {
                                id: socket.user.id
                            }
                        })
                        if(user.coins<=0)  throw new RequestError("You don't have sufficient coins");
                    }else {
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
                    }

                    console.log("\x1b[33m%s\x1b[0m", "person(after):", person);
                    socket.join(randomRoomId);
                    socket.randomRoomId = randomRoomId;
                    console.log("The socket randomRoomId ", randomRoomId);
                    console.log("Rooms this socket has joined", socket.rooms);

                    setTimeout(() => {
                        const usersInRoom = io.sockets.adapter.rooms.get(socket.randomRoomId);
                        console.log("The users in random room: ", usersInRoom.size);
                        if (usersInRoom && usersInRoom.size === 2) {
                            // Notify both users in the room that they are connected
                            const userIds = [];

                            usersInRoom.forEach(async(socketId) => {
                                const userSocket = io.sockets.sockets.get(socketId); // Get the socket instance
                                if (userSocket && userSocket.user && userSocket.user.id) {
                                    userIds.push(userSocket.user.id); // Access socket.user.id and store it
                                    if(userSocket.hasPreference){
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
                            console.log("The room with id: ", socket.randomRoomId, " gets filled with users : ", userIds);
                            io.to(socket.randomRoomId).emit('strangers-connected', { success: true, message: "Connected to stranger", users: userIds });

                        }
                    }, 100);

                } catch (error) {
                    console.log("Error in assigning a random room: ", error);
                    socket.emit('error', { message: error.message });
                }
            });
            socket.on('leave-room', () => {
                socket.leave(socket.randomRoomId);
                io.to(socket.randomRoomId).emit('user-left', "Stranger left the chat");
            })

            socket.on('message', (message) => {
                try {
                    if (message.chatId!=0) {
                        console.log("the message is received and sent to the chat: ", message.chatId, message.messageContent);
                        io.to(message.chatId).emit('message', { userId: socket.user.id, content: message.messageContent, chatId: message.chatId });
                    } else {
                        console.log("the message is received and sent to the random-room: ", socket.randomRoomId, message.messageContent);
                        io.to(socket.randomRoomId).emit('message', { userId: socket.user.id, content: message.messageContent, randomRoomId: socket.randomRoomId, chatId: 0 });
                    }

                } catch (error) {
                    console.log("Error occured while sending the message: ", error);
                    socket.emit('error', { message: "Unable to send the message" });
                }
            })

            socket.on('send-request', () =>{
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

            getOnlineUsers(io);
            

            socket.on('disconnect', async() => {
                console.log("The user disconnected");
                let onlineCount = await db.User.findOne({
                    attributes: ['Online'],
                    where: {
                        id: socket.user.id
                    }
                });
                if(onlineCount.Online>0){
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
                if(onlineCount.Online==1) io.emit('offline', socket.user.id);
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