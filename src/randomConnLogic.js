import crypto from 'crypto';
import socketStrategy from './strategy/auth/socketauth';

let person = {
    MWM: [],
    MWF: [],
    FWF: [],
    FWM: []
}

let randomConnect = (io) => {
    try {
        const randomChatNamespace = io.of("/random-chat");
        randomChatNamespace.use(socketStrategy);
        randomChatNamespace.on("connection", (socket) => {
            let ghave = socket.user.gender;
            let roomId;
            socket.on('gender', ({ gwant }) => {
                console.log("The gwant is: ", gwant);
                let wantHave = gwant + 'W' + ghave;
                let revereseWantHave = ghave + 'W' + gwant;
                console.log(wantHave);
                if (person[wantHave].length > 0) {
                    roomId = person[wantHave][0];
                    person[wantHave].shift();
                } else {
                    roomId = crypto.randomUUID();
                    person[revereseWantHave].push(roomId);
                    console.log("reverseWanthave: ", revereseWantHave, person[revereseWantHave]);
                }
                socket.join(roomId);
                console.log("The socket roomId ", roomId);
                console.log("Rooms this socket has joined (should include roomId):", socket.rooms);

                socket.roomId = roomId;

                setTimeout(() => {
                    const usersInRoom = randomChatNamespace.adapter.rooms.get(socket.roomId);
                    console.log(`Users in room ${socket.roomId}:`, usersInRoom);
                }, 1000); // Check after 100ms
                console.log(`\x1b[34m gwant: ${gwant}, ghave: ${ghave} \x1b[0m`);

            });
            socket.on('message', (message) => {
                console.log("the message is received and sent to the room: ", socket.roomId, message.messageContent);
                randomChatNamespace.to(socket.roomId).emit('message', { userId: socket.user.id, content: message.messageContent });
            })

            socket.on('disconnect', () => {
                console.log("The user left from room: ", socket.roomId);
                const usersInRoom = randomChatNamespace.adapter.rooms.get(socket.roomId);
                const userCount = usersInRoom ? usersInRoom.size : 0;
                console.log("USerInRoom: ", usersInRoom);
                console.log("userCount during disconnection:", userCount);
                randomChatNamespace.to(socket.roomId).emit('roomStatus', "User left");
            })
        });

        const normalChatNamespace = io.of("/normal-chat");
        normalChatNamespace.use(socketStrategy);
        normalChatNamespace.on("connection", (socket) => {
            console.log("User connected to specific chat");
            let roomId;
            socket.on("joinChat", (chatId) => {
                socket.join(chatId);
                socket.roomId = chatId;
                roomId = chatId;
            });

            socket.on('message', (message) => {
                console.log("the message is received and sent to the room: ", socket.roomId, message.messageContent);
                normalChatNamespace.to(socket.roomId).emit('message', { userId: socket.user.id, content: message.messageContent });
            })

            socket.on('disconnect', () => {
                console.log("connection dropped");
                const usersInRoom = randomChatNamespace.adapter.rooms.get(socket.roomId);
                const userCount = usersInRoom ? usersInRoom.size : 0;
                console.log("USerInRoom: ", usersInRoom);
                console.log("userCount during disconnection:", userCount);
                normalChatNamespace.to(socket.roomId).emit('roomStatus', "User left");
            })
        });

    } catch (error) {
        console.log("The error in socket.io is: ", error);
    }
}
export default randomConnect;