import crypto from 'crypto';
import socketStrategy from './strategy/auth/socketauth';
import db from '../models';
import { createMessage } from './service';
import { Op, where } from 'sequelize';
import { signAuthToken } from './authToken';
import { v4 as uuidv4 } from 'uuid';
import botFunctions, { gptPayloadObj } from './botFunctions.js';
import ChatTrie from './chatContext';
import { botInitialMessages, lastMessageReceivedTimeByBot } from './botUtils';
import { socketWrapper } from './socketUtils';
import { weightedRandomChoice } from './functions';
import adminPortal from './adminPortal.js';
import topWaitingUsers from './topWaitingUsers.js';
const ioClient = require('socket.io-client');
// const chatContextQueue = new Queue("chatContextQueue", { connection: redisClient });

export let onlineUsers = {}; //this is going to be an object of array(the array contains the socket ids of same user across different browsers)

let singleRoomIds = {};
class Node {
    constructor(value) {
        this.value = value;       // Value of the current node
        this.children = new Map(); // Map to store children nodes
    }
}

class UserTrie {
    constructor() {
        this.root = new Node(null); // Root is an empty node
    }

    // Insert a sequence into the structure
    insert(sequence) {
        if (sequence.length !== 5 ||
            typeof sequence[0] !== 'string' ||
            typeof sequence[1] !== 'number' ||
            typeof sequence[2] !== 'string' ||
            !/^\d+_\d+$/.test(sequence[3]) ||
            (typeof sequence[4] !== 'number' && typeof sequence[4] !== "string")) {
            throw new Error('Invalid sequence format. Expected format: ["gender", rating, "gender", "rating_rating", "roomId"]');
        }
        let current = this.root;

        for (let i = 0; i < sequence.length; i++) {
            let item = sequence[i];
            if (i == sequence.length - 1) {
                if (!current.children.has("roomId")) {
                    current.children.set("roomId", new Node([item]));
                } else {
                    current.children.get("roomId").value.push(item);
                }
                singleRoomIds[item] = 1;
            } else {
                if (!current.children.has(item)) {
                    current.children.set(item, new Node(item));
                }
                current = current.children.get(item);
            }
        }
    }

    // Match users based on gender and rating
    findMatch(io, selfGender, selfRating, wantGender, wantRatingRange, level = 0, node = this.root) {
        if (level == 4) {
            // Check if roomIds exist
            while (node.children.get("roomId").value.length > 0 && !(io.sockets?.adapter?.rooms?.get(node.children.get("roomId").value[0])?.size)) node.children.get("roomId").value.shift(); //removing those rooms which no longer exists 
            if (node.children.has("roomId") && node.children.get("roomId").value.length > 0) {
                let roomId = node.children.get("roomId").value.shift();
                singleRoomIds[roomId] = 0;
                return roomId;
            }
            return false;
        }
        let randomRoomId = false;
        // console.log("traversing inside findMatch: ", node.value, level, Array.from(node.children.values()));
        for (const child of Array.from(node.children.values())) {
            if (level == 0) {
                if (child.value == wantGender) {
                    randomRoomId ||= this.findMatch(io, selfGender, selfRating, wantGender, wantRatingRange, level + 1, child);
                }
            } else if (level == 1) {
                let [minRating, maxRating] = wantRatingRange.split("_").map(Number);
                if (child.value >= minRating && child.value <= maxRating) {
                    randomRoomId ||= this.findMatch(io, selfGender, selfRating, wantGender, wantRatingRange, level + 1, child);
                }
            } else if (level == 2) {
                if (child.value == selfGender || child.value == "R") {
                    randomRoomId ||= this.findMatch(io, selfGender, selfRating, wantGender, wantRatingRange, level + 1, child);
                }
            } else if (level == 3) {
                let [minRating, maxRating] = child.value.split("_").map(Number);
                if (selfRating >= minRating && selfRating <= maxRating) {
                    randomRoomId ||= this.findMatch(io, selfGender, selfRating, wantGender, wantRatingRange, level + 1, child);
                }
            }
        }
        return randomRoomId;
    }

    // Print the structure for debugging
    print(node = this.root, path = []) {
        path.push(node.value);
        if (node.children.size === 0) {
            console.log(path);
        }
        for (const child of Array.from(node.children.values())) {
            this.print(child, path);
        }
        path.pop();
    }

    getRandomStranger(io, selfGender, selfRating, level, node = this.root) {
        if (level == 4) {
            // Check if roomIds exist
            while (node.children.get("roomId").value.length > 0 && !(io.sockets?.adapter?.rooms?.get(node.children.get("roomId").value[0])?.size)) node.children.get("roomId").value.shift(); //removing those rooms which no longer exists 
            if (node.children.has("roomId") && node.children.get("roomId").value.length > 0) {
                let roomId = node.children.get("roomId").value.shift();
                singleRoomIds[roomId] = 0;
                return roomId;
            }
            return false;
        }
        let randomRoomId = false;
        for (const child of Array.from(node.children.values())) {
            if (level == 0) {
                // if (child.value == wantGender) {
                randomRoomId ||= this.getRandomStranger(io, selfGender, selfRating, level + 1, child);
                // }
            } else if (level == 1) {
                // let [minRating, maxRating] = wantRatingRange.split("_").map(Number);
                // if (child.value >= minRating && child.value <= maxRating) {
                randomRoomId ||= this.getRandomStranger(io, selfGender, selfRating, level + 1, child);
                // }
            } else if (level == 2) {
                if (child.value == selfGender || child.value == 'R') {
                    randomRoomId ||= this.getRandomStranger(io, selfGender, selfRating, level + 1, child);
                }
            } else if (level == 3) {
                let [minRating, maxRating] = child.value.split("_").map(Number);
                if (selfRating >= minRating && selfRating <= maxRating) {
                    randomRoomId ||= this.getRandomStranger(io, selfGender, selfRating, level + 1, child);
                }
            }
        }
        return randomRoomId;
    }

    singleRooms(node = this.root, io, level = 0) {
        if (level === 4) {
            const roomNode = node.children.get("roomId");
            if (!roomNode) return 0;
    
            // Remove stale room IDs
            while (
                roomNode.value.length > 0 &&
                !io.sockets?.adapter?.rooms?.get(roomNode.value[0])?.size
            ) {
                roomNode.value.shift();
            }
    
            return roomNode.value.length;
        }
    
        let ans = 0;
        for (const child of Array.from(node.children.values())) {
            ans += this.singleRooms(child, io, level + 1);
        }
        return ans;
    }    

    // isRoomAvaialble(randomRoomId, level, node=this.root){
    //     if(level==4){

    //     }
    // }
}

export let chatContexts = {}; //"M_greet|F_greet|M_abuse(madarchod)"

let femaleBots = [];
let maleBots = [];
let isBot = {};
let isBotsLoaded = false;
let botClientSockets = {};
let loadBotAccounts = async () => {
    if (isBotsLoaded) return;
    try {
        let botAccounts = await db.User.findAll({
            attributes: ['id', 'gender', 'coins', 'Online', 'name', 'rating'],
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


let connectBot = async (io, socket, strangerGender, strangerWantGender, miWantRating, maWantRating, randomRoomId) => {
    try {
        await loadBotAccounts();
        if (singleRoomIds[randomRoomId]) {
            let bot;
            // let strangerGender = reverseWanthave[2];
            if (strangerWantGender === 'F') {
                if (femaleBots.length > 0) {
                    bot = femaleBots[0];
                    femaleBots.shift();
                    console.log("Female bot is fired to connect to user, remaining female bots: ", femaleBots.length);
                } else {
                    console.log("No female bots left");
                    throw new RequestError("No online users with given preferences, please broaden your preferences", 409);
                    return;
                }
            } else {
                if (maleBots.length > 0) {
                    bot = maleBots[0];
                    maleBots.shift();
                    console.log("Male bot is fired to connect to user, remaining male bots: ", maleBots.length);
                } else {
                    console.log("No male bots left");
                    throw new RequestError("No online users with given preferences, please broaden your preferences", 409);
                    return;
                }
            }
            await db.User.update({
                rating: Math.floor(Math.random() * (maWantRating - miWantRating + 1)) + miWantRating
            }, {
                where: {
                    id: bot.id
                }
            })
            const token = signAuthToken(bot);
            let botClientSocket;
            if (!botClientSockets[bot.id]) {
                console.log("reaching inside !onlineUsers[bot.id]: ");
                botClientSocket = ioClient(process.env.BACKEND_URL, {
                    extraHeaders: {
                        Authorization: `Bearer ${token}` // Pass JWT token here
                    }
                });
                // console.log("the botSocketClient is: ", botClientSocket, token);
                botClientSockets[bot.id] = botClientSocket
                botClientSocket.on('connect', socketWrapper(async () => {
                    console.log(`Bot ${bot.id} connected to the server`);
                    botClientSocket.on('user-left', socketWrapper(async (data) => {
                        console.log("The bot with id: ", bot.id, " leaving the room");
                        botClientSocket.emit('leave-room');
                        // botClientSocket.disconnect();
                        const botSocketIds = onlineUsers[bot.id];
                        for(let botSocketId of botSocketIds){
                            const botSocket = io.sockets.sockets.get(botSocketId);
                            if (bot.gender == "F") {
                                femaleBots.push(bot);
                                console.log("Female bot " + bot.name + " has been pushed to available female bots: ", femaleBots.length);
                            }
                            else if (bot.gender == 'M') {
                                maleBots.push(bot);
                                console.log("Male bot " + bot.name + " has been pushed to available male bots: ", maleBots.length);
                            }
                            await botFunctions.clearBotReplies(botSocket.randomRoomId);
                        }
                    }, socket));
                    botClientSocket.on('strangers-connected', socketWrapper(async (res) => {
                        let users = res.users;
                        let stranger = users.find(user => user.id !== bot.id);
                        await botFunctions.botInit(bot.gender, stranger.gender, res.roomId, bot.rating);
                        let sendBotInitial = weightedRandomChoice(['SEND_INITIAL', 'DONT'], [0.4, 0.6]);
                        if(sendBotInitial==="SEND_INITIAL") await botFunctions.botSent(botInitialMessages[Math.floor(Math.random() * botInitialMessages.length)], botClientSocket, bot.gender, bot.name);
                    }, socket))
                    botClientSocket.on('message', async (message) => {
                        try {
                            const identityKey = uuidv4();
                            if (message.userId != bot.id) {
                                let user = await db.User.findOne({
                                    attributes: ['id', 'gender', 'name'],
                                    where: {
                                        id: message.userId
                                    }
                                });
                                gptPayloadObj[(message.randomRoomId || message.chatId)].messages.push({ role: "user", content: message.content });
                                let botReplyDelay = Math.floor(Math.random() * (2000-700+1))+700;
                                if(lastMessageReceivedTimeByBot[bot.id]){
                                    let timeDifference = new Date() - lastMessageReceivedTimeByBot[bot.id].time;
                                    if(timeDifference<botReplyDelay){
                                        clearTimeout(lastMessageReceivedTimeByBot[bot.id].timeout);
                                        console.log("\x1b[33m%s\x1b[0m", "The message receiving for bot id ", bot.id, " is cleared because of the quickness: ", timeDifference);
                                    }
                                }
                                let replyStatus, leaveRoom;
                                console.log("The chatContexts length: ", chatContexts[message.randomRoomId], chatContexts[message.randomRoomId]?.length);
                                if(!chatContexts[message.randomRoomId] || chatContexts[message.randomRoomId].length<25){
                                    replyStatus = weightedRandomChoice(['REPLY', 'DONT'], [0.6, 0.4]);
                                    leaveRoom = weightedRandomChoice(['LEAVE', 'DONT'], [0.1, 0.9]);
                                }else if(chatContexts[message.randomRoomId].length<50){
                                    replyStatus = weightedRandomChoice(['REPLY', 'DONT'], [0.7, 0.3]);
                                    leaveRoom = weightedRandomChoice(['LEAVE', 'DONT'], [0.2, 0.8]);
                                }else if(chatContexts[message.randomRoomId].length<100){
                                    replyStatus = weightedRandomChoice(['REPLY', 'DONT'], [0.8, 0.2]);
                                    leaveRoom = weightedRandomChoice(['LEAVE', 'DONT'], [0.3, 0.7]);
                                }else {
                                    replyStatus = weightedRandomChoice(['REPLY', 'DONT'], [0.9, 0.1]);
                                    leaveRoom = weightedRandomChoice(['LEAVE', 'DONT'], [0.4, 0.6]);
                                }
                                if(!chatContexts[message.randomRoomId]){ //if the conversation has not started yet then keep the bot leaving the room probability to be 50-50
                                    leaveRoom = weightedRandomChoice(['LEAVE', 'DONT'], [0.5, 0.5]);
                                }
                                console.log("\x1b[35m%s\x1b[0m", "The reply status: ", replyStatus);
                                if(replyStatus==="DONT") return;
                                if(leaveRoom==="LEAVE" || (chatContexts[message.randomRoomId] && chatContexts[message.randomRoomId].length)>500){
                                    setTimeout(socketWrapper(async () => {
                                        botClientSocket.emit('leave-room');
                                    }, socket), botReplyDelay);
                                    return;
                                }
                                lastMessageReceivedTimeByBot[bot.id] = {time: new Date()}
                                lastMessageReceivedTimeByBot[bot.id].timeout = setTimeout(socketWrapper(async () => {
                                    botClientSocket.emit('typing', { chatId: message.chatId, isTyping: true });
                                    let [reply, status] = await botFunctions.botReply(message.content, bot.gender, user.gender, (message.randomRoomId || message.chatId), bot.name);
                                    let botMessageSentDelay = (10000*(reply.length))/70; //took 10 seconds to write 70 characters
                                    // botClientSocket.emit('typing', { chatId: message.chatId, isTyping: false });
                                    setTimeout(socketWrapper(async()=>{
                                        let isInAppropriateMessage = reply.includes("INAPPROPRIATE");
                                        if (isInAppropriateMessage) {
                                            reply = reply.replace("INAPPROPRIATE", "").trim();
                                        }                                
                                        botClientSocket.emit("message", { messageContent: reply, chatId: message.chatId, identityKey });
                                        if(status==="DISCONNECT" || isInAppropriateMessage){
                                            // const delay = Math.floor(Math.random() * (4500 - 2500 + 1)) + 2500;
                                            let delay = (5000*(reply.length))/75+Math.floor(Math.random() * (1500));
                                            setTimeout(socketWrapper(async() => {
                                                console.log("The bot with id: ", bot.id, " leaving the room because of disconnect status");
                                                botClientSocket.emit('typing', { chatId: message.chatId, isTyping: false });
                                                botClientSocket.emit('leave-room');
                                                // botClientSocket.disconnect();
                                                const botSocketIds = onlineUsers[bot.id];
                                                for(let botSocketId of botSocketIds){
                                                    const botSocket = io.sockets.sockets.get(botSocketId);
                                                    if (bot.gender == "F") {
                                                        femaleBots.push(bot);
                                                        console.log("Female bot " + bot.name + " has been pushed to available female bots: ", femaleBots.length);
                                                    }
                                                    else if (bot.gender == 'M') {
                                                        maleBots.push(bot);
                                                        console.log("Male bot " + bot.name + " has been pushed to available male bots: ", maleBots.length);
                                                    }
                                                    await botFunctions.clearBotReplies(botSocket.randomRoomId);
                                                }
                                            }, socket), delay);
        
                                        }

                                    }, socket), botMessageSentDelay)
                                }, socket), botReplyDelay);
                            }

                        } catch (error) {
                            console.log("The error is: ", error);
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
                }, socket))
            } else botClientSocket = botClientSockets[bot.id];

            // console.log("the online users bot: ", onlineUsers[bot.id]);
            // console.log("the bot clientSocket is: ", botClientSocket);
            if (botClientSocket) {
                botClientSocket.emit('join-room', { gwant: strangerGender, miRating: 0, maRating: 5 });
                // console.log(`Bot ${bot.id} joined room ${randomRoomId}`);
            } else {
                if (bot.gender == "F") {
                    femaleBots.push(bot);
                    console.log("Female bot " + bot.name + " has been pushed to available female bots bcoz of falsy botClientScoket: ", femaleBots.length);
                }
                else if (bot.gender == 'M') {
                    maleBots.push(bot);
                    console.log("Male bot " + bot.name + " has been pushed to available male bots because of falsy botClientSocket: ", maleBots.length);
                }
            }
            // person[reverseWanthave] = person[reverseWanthave].filter(roomId => roomId !== randomRoomId);
        }

    } catch (error) {
        socket.emit('error', {
            response: {
                data: {
                    success: false,
                    messages: error.errorList
                }
            }
        });
    }
}

let rcUsers = new UserTrie(); //Ready to chat users

let randomConnect = (io) => {
    try {
        io.on("connection", (socket) => {
            console.log("The socket connection has been established");
            if(socket.user.email === process.env.ADMIN_EMAIL_ID){
                console.log("\x1b[32m%s\x1b[0m", "The admin is connected");
                adminPortal.triggerEvent("total-users");
                adminPortal.triggerEvent("random-rooms", rcUsers.singleRooms(rcUsers.root, io, 0));
                adminPortal.triggerEvent("top-waiting-users");
            }
            if(onlineUsers[socket.user.id]?.length && !onlineUsers[socket.user.id].includes(socket.id)){
                onlineUsers[socket.user.id].push(socket.id);
            }else{
                onlineUsers[socket.user.id] = [socket.id];
            }
            console.log("the online users after connecting the user is: ", onlineUsers);
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
            adminPortal.triggerEvent("total-users");
            io.emit('online', socket.user.id);
            socket.on('join-room', socketWrapper(async ({ gwant, miRating = 0, maRating = 5 }) => {
                console.log("\x1b[31m%s\x1b[0m", "reaching to join room");
                try {
                    if (!["M", "F", "R"].includes(gwant)) throw new RequestError("Invalid gender preference", 400);
                    miRating = Number(miRating);
                    maRating = Number(maRating);
                    socket.hasPreference = gwant === "M" || gwant === "F";
                    if (!Number.isFinite(miRating) || !Number.isFinite(maRating)
                        || miRating < 0 || maRating > 5 || miRating > maRating) {
                        throw new RequestError("Invalid preferred rating range", 400);
                    }
                    console.log("Request received for assigning to random room, ghave: ", socket.user.gender, "selfRating: ", socket.user.rating, " gwant: ", gwant, " miRating: ", miRating, " maRating: ", maRating);
                    let randomRoomId;
                    if (socket.hasPreference) {
                        let user = await db.User.findOne({
                            attributes: ['id', 'coins'],
                            where: {
                                id: socket.user.id
                            }
                        })
                        if (user.coins < 10 && !isBot[user.id]) {
                            throw new RequestError("You need 10 coins for this preference", 409);
                        }
                    } else {
                        //do something in this case
                        randomRoomId = rcUsers.getRandomStranger(io, socket.user.gender, socket.user.rating, 0);
                        // gwant = getOnlineUsers(io, socket.user.gender);
                    }
                    // console.log("UsersTrie before: ", rcUsers.print());
                    if (!randomRoomId) randomRoomId = rcUsers.findMatch(io, socket.user.gender, socket.user.rating, gwant, `${miRating}_${maRating}`, 0);
                    if(randomRoomId){
                        const socket = io.sockets.sockets.get([...io.sockets.adapter.rooms.get(randomRoomId)][0]);
                        topWaitingUsers.remove(socket.user);
                        adminPortal.triggerEvent("top-waiting-users");                        
                    }else if (!randomRoomId && socket.user.email.split('@')[1] !== 'bot.com') {
                        randomRoomId = crypto.randomUUID();
                        rcUsers.insert([socket.user.gender, socket.user.rating, gwant, `${miRating}_${maRating}`, randomRoomId]);
                        if (!socket.user.isAdmin) {
                            setTimeout(socketWrapper(async () => {
                                try {
                                    if(process.env.CONNECT_BOT === "true") {
                                        await connectBot(io, socket, socket.user.gender, gwant === "R" ? "F" : gwant, miRating, maRating, randomRoomId);
                                    }else{
                                        // throw new RequestError("No online users with given preferences, please broaden your preferences")
                                    }

                                } catch (error) {
                                    socket.leave(randomRoomId);
                                    await adminPortal.triggerEvent("random-rooms", rcUsers.singleRooms(rcUsers.root, io, 0));
                                    throw new RequestError("No online users with given preferences, please broaden your preferences")
                                }
                            }, socket), 5000);
                        }
                        topWaitingUsers.insert({...socket.user, wantGender: gwant, miWantRating: miRating, maWantRating: maRating});
                    }
                    rcUsers.print();

                    socket.join(randomRoomId);
                    adminPortal.triggerEvent("top-waiting-users");
                    await adminPortal.triggerEvent("random-rooms", rcUsers.singleRooms(rcUsers.root, io, 0));
                    socket.randomRoomId = randomRoomId;
                    socket.randomRoomJoinedAt = new Date();
                    console.log("The socket randomRoomId ", randomRoomId);
                    console.log("Rooms this socket has joined", socket.rooms);

                    // setTimeout(() => {
                    const usersInRoom = io.sockets.adapter.rooms.get(socket.randomRoomId);
                    console.log("The users in random room: ", usersInRoom.size);
                    if (usersInRoom && usersInRoom.size === 2) {
                        // Notify both users in the room that they are connected
                        const users = [];

                        for (const socketId of usersInRoom) {
                            const userSocket = io.sockets.sockets.get(socketId); // Get the socket instance
                            if (userSocket && userSocket.user && userSocket.user.id) {
                                const { id, name, gender, rating, pic } = userSocket.user;
                                users.push({ id, name, gender, rating, pic });
                                if (userSocket.hasPreference) {
                                    await db.User.update({
                                        coins: db.Sequelize.literal(`coins-10`)
                                    }, {
                                        where: {
                                            id: userSocket.user.id,
                                            coins: { [Op.gte]: 10 }
                                        }
                                    })
                                }
                            }
                        }
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
            }, socket));
            socket.on('leave-room', socketWrapper(async() => {
                socket.leave(socket.randomRoomId);
                socket.hasPreference = false;
                if (socket.randomRoomId && chatContexts[socket.randomRoomId]) delete chatContexts[socket.randomRoomId];
                console.log("Clearing chat context for room: ", socket.randomRoomId);
                io.to(socket.randomRoomId).emit('user-left', "Stranger left the chat");
                await adminPortal.triggerEvent("random-rooms", rcUsers.singleRooms(rcUsers.root, io, 0));
            }, socket))

            socket.on('message', async (message) => {
                try {
                    if (message.chatId != 0) {
                        let createdAt = new Date();
                        io.to(message.chatId).emit('message', { userId: socket.user.id, content: message.messageContent, chatId: message.chatId, identityKey: message.identityKey, createdAt });
                        createMessage(socket, message.chatId, message.messageContent, createdAt);
                    } else {
                        if (!socket.randomRoomId) {
                            throw new RequestError("This chat room doesn't exist anymore", 409);
                        }
                        let isBotInRoom = false;
                        const usersInRoom = io.sockets.adapter.rooms.get(socket.randomRoomId);
                        console.log("The users in random room: ", usersInRoom.size);
                        if (usersInRoom && usersInRoom.size === 2) {
                            usersInRoom.forEach(async (socketId) => {
                                const userSocket = io.sockets.sockets.get(socketId); // Get the socket instance
                                if (userSocket && userSocket.user && userSocket.user.id) {
                                    if (isBot[userSocket.user.id]) isBotInRoom = true;
                                }

                            });
                        }
                        if (isBotInRoom) {
                            console.log("\x1b[33m%s\x1b[0m", "This room contains a bot user, hence doesn't storing the context, roomId: ", socket.randomRoomId);
                        }
                        if (isBotInRoom || process.env.CHAT_CONTEXT_TRIE_UPDATE === "true") {
                            // let chatContextWaitForCompletion = await addJobAndWait('chatContextQueue', { message, isBotInRoom, socketRandomRoomId: socket.randomRoomId, socketUserId: socket.user.id });
                            // console.log("The chat context job is: ", chatContextWaitForCompletion);
                            // let chatContextJob = chatContextQueue.add('processChatContexts', { message, isBotInRoom, socketRandomRoomId: socket.randomRoomId, socketUserId: socket.user.id });
                            let createChatContextConditionallyInTrie = async () => {
                                let messageLabel = null;
                                // messageLabel = await botFunctions.gptMessageLabelling(message.messageContent);
                                messageLabel = await botFunctions.labelMessage(message.messageContent);
                                console.log("The classified message ------------->>>>>>>>>>>>>>>>>>>>>>", messageLabel);
                                if (!messageLabel) {
                                    // messageLabel = "test";
                                    return;
                                }
                                const chatContext = chatContexts[socket.randomRoomId];
                                //M_greet|F_greet|M_confusion(Kya kru zindagi ka) #chatContext format
                                // let strangerId = await redis.getData(`strangerId-${socket.randomRoomId}`);
                                // if(!strangerId){
                                //     strangerId = socket.user.id;
                                //     await redis.setData(`strangerId-${socket.randomRoomId}`, strangerId);
                                // }
                                // console.log("The strangerId: ", strangerId, " The socket user id: ", socket.user.id);
                                // console.log("the old chat context: ", chatContext);
                                let chatTrie = new ChatTrie();
                                if (chatContext && !isBotInRoom) chatTrie.storeReply(chatContext, message.messageContent);
                                let newChatContext;
                                if (chatContext) newChatContext = chatContext.split("(")[0] + "|" + ((socket.user.gender === "M") ? "M_" : "F_") + messageLabel + "(" + message.messageContent + ")";
                                else newChatContext = ((socket.user.gender === "M") ? "M_" : "F_") + messageLabel + "(" + message.messageContent + ")";
                                chatContexts[socket.randomRoomId] = newChatContext;
                                // console.log("the new chat context is: ", newChatContext);
                            }
                            if (isBotInRoom) {
                                if (!isBot[socket.user.id]) socket.emit('message', { userId: socket.user.id, content: message.messageContent, randomRoomId: socket.randomRoomId, chatId: 0, createdAt: new Date(), identityKey: message.identityKey });
                                await createChatContextConditionallyInTrie();
                                if (isBot[socket.user.id]) socket.to(socket.randomRoomId).emit('typing-status', { chatId: 0, isTyping: false, userId: socket.user.id });
                            } else {
                                createChatContextConditionallyInTrie();
                            }

                        }
                        console.log("the message is received and sent to the random-room: ", socket.randomRoomId, message.messageContent);
                        io.to(socket.randomRoomId).emit('message', { userId: socket.user.id, content: message.messageContent, randomRoomId: socket.randomRoomId, chatId: 0, createdAt: new Date(), identityKey: message.identityKey, type: message.type });
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
                const friendSocketIds = onlineUsers[friendId] || [];
                console.log("reached to send-request-accept-friend", friendSocketIds);

                for(let friendSocketId of friendSocketIds){
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
                }
            });

            socket.on('typing', (res) => {
                if (res.chatId != 0) {
                    socket.to(res.chatId).emit('typing-status', { ...res, userId: socket.user.id });
                } else {
                    socket.to(socket.randomRoomId).emit('typing-status', { ...res, userId: socket.user.id });
                }
            })

            // getOnlineUsers(io);


            socket.on('disconnect', socketWrapper(async () => {
                console.log("The user disconnected");
                socket.hasPreference = false;
                const onlineCount = await db.User.findOne({
                    attributes: ['Online'],
                    where: {
                        id: socket.user.id
                    }
                });
                if (onlineCount?.Online > 0) {
                    await db.User.update(
                        {
                            Online: onlineCount.Online - 1,
                        },
                        {
                            where: {
                                id: socket.user.id,
                            },
                        }
                    );

                    if (onlineCount.Online === 1) io.emit('offline', socket.user.id);
                }
                if (socket.randomRoomId) {
                    io.to(socket.randomRoomId).emit('user-left', "Stranger left the chat");
                }
                if (socket.user?.id && onlineUsers[socket.user.id]?.length) {
                    console.log("gonna remove the socket.user.id: ------------------------------", socket.user.id);
                    onlineUsers[socket.user.id] = onlineUsers[socket.user.id].filter(id => id !== socket.id);
                    if (onlineUsers[socket.user.id].length === 0){
                        delete onlineUsers[socket.user.id]; // Remove the user from onlineUsers map
                    }
                    console.log("the online users afret disconnect: ", onlineUsers);
                }
                if (socket.randomRoomId && chatContexts[socket.randomRoomId]) delete chatContexts[socket.randomRoomId];
                topWaitingUsers.remove(socket.user);
                await adminPortal.triggerEvent("total-users");
                await adminPortal.triggerEvent("random-rooms", rcUsers.singleRooms(rcUsers.root, io, 0));
                await adminPortal.triggerEvent("top-waiting-users");

            }, socket));
        });

    } catch (error) {
        console.log("The error in socket.io is: ", error);
    }
}
export default randomConnect;
