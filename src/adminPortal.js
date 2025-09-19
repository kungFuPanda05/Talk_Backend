import db from "../models";
import io from "./index";
import { onlineUsers } from "./randomConnLogic";
import redis from "./redis";
//currently i am calculating things via just traversing everytime it want but this approach isn't scalable when number of concurrent nline users increases it will become a bottleneck so u just need to change that thing by maintaining counter for verything and proper counter increment and decrement, i guess upto 1000 concurrent users there won't be any issue
export default {
    async triggerEvent(eventName, data) {
        console.log("reaching to trigger events---------------------", eventName);
        let adminId = await redis.getData("adminId");
        if (!adminId) {
            let admin = await db.User.findOne({
                where: {
                    email: process.env.ADMIN_EMAIL_ID || 'vishal.gautam@admin.com'
                }
            });
            adminId = admin.id;
            await redis.setData("adminId", adminId, 60 * 5);
        }
        if (!onlineUsers[adminId] || onlineUsers[adminId].length == 0) {
            console.log("Admin is not online");
            console.log("The online users are: ", onlineUsers);
            return;
        }
        const socketIds = onlineUsers[adminId];
        for (let socketId of socketIds) {
            console.log("The socketId of admin is: ", socketId);
            const socket = io.sockets.sockets.get(socketId);
            if (!socket) return;
            if (eventName == "admin-check") {
                socket.emit('admin-check', "currently successfully getting admin-check event");
            } else if (eventName === "total-users") {
                let totalUsers = await redis.wrapper("total-users", async () => {
                    return db.User.count();
                }, 60 * 5);

                let totalMaleUsers = await redis.wrapper('total-male-users', async () => {
                    return db.User.count({
                        where: {
                            gender: 'M'
                        }
                    })
                }, 60 * 5)
                let totalFemaleUsers = totalUsers - totalMaleUsers;

                let totalOnlineUsers = 0;
                let totalOnlineMale = 0;
                let totalOnlineFemale = 0;
                for (let key in onlineUsers) {
                    let gender = io.sockets.sockets.get(onlineUsers[key][0])?.user?.gender;
                    if (gender === 'M') totalOnlineMale++;
                    else if (gender === 'F') totalOnlineFemale++;
                }
                totalOnlineUsers = totalOnlineMale + totalOnlineFemale;
                socket.emit('total-users', { totalUsers, totalMaleUsers, totalFemaleUsers, totalOnlineUsers, totalOnlineMale, totalOnlineFemale });
            } else if (eventName === "random-rooms") {
                let randomRooms = Array.from(io.sockets.adapter.rooms.keys())
                    .filter(roomId => !/^\d+$/.test(roomId) && roomId.length === 36);
                let randomRoomsCount = randomRooms.length;
                console.log("\x1b[34m%s\x1b[0m", "reaching to the random rooms and the random rooms are: ", randomRooms);
                console.log("\x1b[34m%s\x1b[0m", "the single rooms are: ", data);
                let count = 0;
                let roomUsersObj = {};
                for (let roomId of randomRooms) {
                    const usersInRoom = io.sockets.adapter.rooms.get(roomId);
                    if (!usersInRoom || usersInRoom.size < 2) continue;
                    roomUsersObj[roomId] = [];
                    count++;
                    for (let socketId of usersInRoom) {
                        const socket = io.sockets.sockets.get(socketId);
                        if (socket && socket.user) {
                            roomUsersObj[roomId].push({ id: socket.user.id, name: socket.user.name, email: socket.user.email });
                        }
                    }
                    if (count == 10) break;
                }

                socket.emit('random-rooms', { randomRooms: { activeRooms: randomRoomsCount - data, totalRooms: randomRoomsCount }, roomUsersObj });
            }
        }

    }
}