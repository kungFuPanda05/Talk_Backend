import crypto from 'crypto';

let person = {
    MWM: [],
    MWF: [],
    FWF: [],
    FWM: []
}
let randomConnect=(io)=>{
    io.on('connection', (socket)=>{
        let roomId;
        socket.on('gender', ({gwant, ghave})=>{
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
            console.log("Users in room: ", usersInRoom);
            console.log(`\x1b[34m gwant: ${gwant}, ghave: ${ghave} \x1b[0m`);
            
        });
        socket.on('message', (message)=>{
            io.to(message.roomId).emit('message', message);
        })

        socket.on('disconnect', ()=>{
            console.log("The user left from room: ", socket.roomId);
            io.to(roomId).emit('roomStatus', "User left");
        })
    })
}
export default randomConnect;