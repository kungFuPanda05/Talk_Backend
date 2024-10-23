import crypto from 'crypto';

let person = {
    MWM: [],
    MWF: [],
    FWF: [],
    FWM: []
}
let randomConnect=(io)=>{
    io.on('connection', (socket)=>{
        let ghave = socket.user.gender;
        let roomId;
        socket.on('gender', (gwant)=>{
            console.log("The gwant is: ", gwant);
            let wantHave = gwant+'W'+ghave;
            let revereseWantHave = ghave+'W'+gwant;
            console.log(wantHave);
            if(person[wantHave].length>0){
                roomId = person[wantHave][0];
                person[wantHave].shift();
            }else{
                roomId = crypto.randomUUID();
                person[revereseWantHave].push(roomId);
                console.log("reverseWanthave: ", revereseWantHave, person[revereseWantHave]);
            }
            socket.join(roomId);
            socket.roomId = roomId;
            socket.emit('getRoom', roomId);
            
            const usersInRoom = io.sockets.adapter.rooms.get(roomId);
            console.log("Users in room: ", roomId, usersInRoom);
            console.log(`\x1b[34m gwant: ${gwant}, ghave: ${ghave} \x1b[0m`);
            
        });
        socket.on('message', (message)=>{
            console.log("the message is received and sent to the room: ", socket.roomId, message.messageContent);
            io.to(message.roomId).emit('message', {userId: socket.user.id, content: message.messageContent});
        })

        socket.on('disconnect', ()=>{
            console.log("The user left from room: ", socket.roomId);
            const usersInRoom = io.sockets.adapter.rooms.get(socket.roomId);
            const userCount = usersInRoom ? usersInRoom.size : 0;
            console.log("USerInRoom: ", usersInRoom);
            console.log("userCount during disconnection:", userCount);
            io.to(roomId).emit('roomStatus', "User left");
        })
    })
}
export default randomConnect;