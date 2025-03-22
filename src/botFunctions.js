import ChatTrie from "./chatContext";
import { match, similarityIndex, sentenceMatchRatio, sleep } from "./functions"
import axios from 'axios';
import { chatContexts } from "./randomConnLogic";
import { disconnectKeys, replies, validLabels, MTM, MTF, FTF, FTM } from "./botUtils";
import { v4 as uuidv4 } from 'uuid';
// import { pipeline } from '@xenova/transformers';
const { loadClassifier } = require('./xenovawrapper');


let matchedReply = (input, selfGender, strangerGender) => {
    console.log("The selfGender is: ", selfGender);
    console.log("The strangerGender is: ", strangerGender);
    let reply = "";
    let maxMatch = 0;
    let tempReplies = {};
    let replyKey = "";
    if (strangerGender === 'M' && selfGender === 'M') tempReplies = MTM;
    else if (strangerGender === 'M' && selfGender === 'F') tempReplies = FTM;
    else if (strangerGender === 'F' && selfGender === 'F') tempReplies = FTF;
    else if (strangerGender === 'F' && selfGender === 'M') tempReplies = MTF;
    for (let key in tempReplies) {
        let matchRatio = sentenceMatchRatio(input, key);
        if (matchRatio > maxMatch) {
            maxMatch = matchRatio;
            reply = tempReplies[key][0];
            tempReplies[key].push(tempReplies[key].shift());
            replyKey = key;
            console.log("\x1b[35mThe key : \x1b[0m", key, "\x1b[35m and the reply: \x1b[0m", reply);
        }
    }
    tempReplies = replies;
    for (let key in tempReplies) {
        let matchRatio = sentenceMatchRatio(input, key);
        if (matchRatio > maxMatch) {
            maxMatch = matchRatio;
            reply = tempReplies[key][0];
            tempReplies[key].push(tempReplies[key].shift());
            replyKey = key;
            console.log("\x1b[35mThe key : \x1b[0m", key, "\x1b[35m and the reply: \x1b[0m", reply);
        }
    }
    if (maxMatch < process.env.MATCH_PERCENTAGE) return ["UNABLE_TO_PROCESS", "CONTINUE"];
    return [reply, replyKey];
}
let matchedReplyAdvance = async (input, selfGender, strangerGender) => {
    let objName = eval(`${selfGender}T${strangerGender}`);
    let getSystemDefault = (objName) => {
        return `Which key matches the most from this stringified array: ${JSON.stringify(Object.keys(objName))}, just give me the name of the key nothing else, if nothing matches then send response UNABLE_TO_PROCESS`;
    }
    let gptSystemDefault = getSystemDefault(objName);
    const response = await axios.post(process.env.GPT_URL,
        {
            "model": "gpt-4o",
            "messages": [
                {
                    "role": "system",
                    "content": gptSystemDefault
                },
                {
                    "role": "user",
                    "content": input
                }
            ],
            "temperature": 1
        }, {
        headers: {
            Authorization: `Bearer ${process.env.GPT_KEY}`,
            "Content-Type": "application/json"
        }
    });
    let objKey = response.data.choices[0].message.content;

    if (objKey === "UNABLE_TO_PROCESS") {
        const response = await axios.post(process.env.GPT_URL,
            {
                "model": "gpt-4o",
                "messages": [
                    {
                        "role": "system",
                        "content": getSystemDefault(replies)
                    },
                    {
                        "role": "user",
                        "content": input
                    }
                ],
                "temperature": 1
            }, {
            headers: {
                Authorization: `Bearer ${process.env.GPT_KEY}`,
                "Content-Type": "application/json"
            }
        });
        objKey = response.data.choices[0].message.content;
        objName = replies;
    }
    if (objKey === "UNABLE_TO_PROCESS" || !objName[objKey]) return objKey;
    return objName[objKey][Math.floor(Math.random() * objName[objKey].length)];
}

let systemRoleObj = {};
export let gptPayloadObj = {};
// let classifier; // Caching the classifier
// let classifierLoading; // Promise to prevent multiple simultaneous loads

// async function loadClassifier() {
//     if (!classifierLoading) {
//         classifierLoading = (async () => {
//             const { pipeline } = await import('@xenova/transformers');
//             classifier = await pipeline('zero-shot-classification', 'Xenova/distilbart-mnli-12-3');
//         })();
//     }
//     await classifierLoading;
// }


export default {
    async botInit(selfGender, strangerGender, roomId, rating) {
        systemRoleObj[roomId] = `
            You are connected to a stranger, and your task is to behave like a real human. 
            Your gender is ${selfGender}, rating is ${rating} while the stranger is of gender ${strangerGender}. 
            The stranger has no clue that you are an AI language model, so behave convincingly like a human. 
            You don't need to please the stranger. If you dislike their words or behavior, feel free to roast them. 
            If the stranger abuses you, respond with sharper or wittier comebacks or even you can abuse them back, and don't hesitate to roast them back. 
            Inject humor and sarcasm where appropriate, but stay contextually relevant.
            Always make the conversation engaging and dynamic, just as a human would.Try to make responses as short as possible for example if someone say hi, hello, hey, then simply reply with hi, hello, if someone says how are you then say i am fine wbu or what abou you or mein toh theek hu, like that.
            Never ever say you are and AI or a bot, always pretend to be a human. if someone says m or f then tell whatever your gender is in a single word. Try to send replies as short as possible. Speak frankly. If someone tries to ask you random coding questions or anything technical then don't give them the definition, do not try to explain them, just give a human like response.
            If the strangers talks trash to you, harasses you, abuse you, do not talk properly, makes you feel uncomfortable then in your response add INAPPROPROATE at the end
        `;

        gptPayloadObj[roomId] = {
            model: "gpt-4",
            messages: [
                { role: "system", content: systemRoleObj[roomId] }, // System role
            ],
            temperature: 1
        };
    },
    async botReply(input, selfGender, strangerGender, roomId, selfName) {
        try {
            // let predefinedReply = "UNABLE_TO_PROCESS";
            // let predefinedReply = await matchedReplyAdvance(input, selfGender, strangerGender);
            let [predefinedReply, predefinedReplyKey] = matchedReply(input, selfGender, strangerGender);
            console.log("The predefined reply: ", predefinedReply, " the predifined reply key: ", predefinedReplyKey);
            if (disconnectKeys.includes(predefinedReplyKey)) return [predefinedReply, "DISCONNECT"]
            if (predefinedReply === "SEND_REAL_NAME") {
                predefinedReply = [selfName, selfName, selfName, 'My name is ' + selfName, 'I am ' + selfName, 'I am ' + selfName + ' and you?', "mera naam hai " + selfName][Math.floor(Math.random() * 7)];
            }
            // gptPayloadObj[roomId].messages.push({ role: "user", content: input });
            let reply = predefinedReply;
            if (predefinedReply === "UNABLE_TO_PROCESS") {
                let chatTrie = new ChatTrie();
                console.log("The chatcontexts is: ", chatContexts);
                if (chatContexts[roomId]) {
                    console.log("The context for which searching is: ", chatContexts[roomId]);
                    reply = await chatTrie.getReply(chatContexts[roomId]);
                    console.log("\x1b[33mThe chatTries reply: \x1b[0m", reply);
                }
                let response;
                if (!reply || reply === "UNABLE_TO_PROCESS") {
                    response = await axios.post(process.env.GPT_URL, gptPayloadObj[roomId], {
                        headers: {
                            Authorization: `Bearer ${process.env.GPT_KEY}`,
                            "Content-Type": "application/json"
                        }
                    });
                    reply = response.data.choices[0].message.content;
                }
            }
            gptPayloadObj[roomId].messages.push({ role: "assistant", content: reply });
            return [reply, "CONTINUE"];

        } catch (error) {
            console.log("\x1b[31mThe error occured in calculating bot reply: \x1b[0m", error.message);
            throw new RequestError("Stranger left the chat");
        }
    },
    async clearBotReplies(roomId) {
        console.log("Clearing the message history for bot chat room with id: ", roomId);
        if (systemRoleObj[roomId]) {
            delete systemRoleObj[roomId];
            console.log("clear systemrole for roomId: ", roomId);
        };
        if (gptPayloadObj[roomId]) {
            delete gptPayloadObj[roomId];
            console.log("clear gptpayload for random roomId: ", roomId);
        }
    },

    async gptMessageLabelling(message) {
        async function askGpt(promptMessage) {
            const response = await axios.post(
                process.env.GPT_URL,
                {
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "system",
                            content: `Label the message "${promptMessage}" with exactly one word from the following list: ${JSON.stringify(
                                validLabels
                            )}. For example, if the message is "hello" then label it as "greet". Return only the one word.`
                        }
                    ],
                    temperature: 1
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.GPT_KEY}`,
                        "Content-Type": "application/json"
                    }
                }
            );
            const label = response.data.choices[0].message.content.toLowerCase().trim();
            return label;
        }

        try {
            let label = await askGpt(message);
            if (!validLabels.includes(label)) {
                label = await askGpt(message);
            }

            if (!validLabels.includes(label)) {
                throw new Error("GPT didn't return a valid one-word label.");
            }

            return label;
        } catch (error) {
            console.log("\x1b[31mError occurred while labelling the message:\x1b[0m", error);
            return "convo";
        }
    },

    async botSent(botMessageArray, botClientSocket, botGender, selfName) {
        try {
            for (let botMessage of botMessageArray) {
                if (botMessage === "SEND_REAL_GENDER") botMessage = botGender;
                else if (botMessage === "SEND_REAL_NAME") botMessage = [selfName, selfName, selfName, 'My name is ' + selfName, 'I am ' + selfName, 'I am ' + selfName + ' and you?', "mera naam hai " + selfName][Math.floor(Math.random() * 7)];
                else if (botMessage === "SEND_REAL_AGE") botMessage = replies["age"][Math.floor(Math.random() * replies["age"].length - 8)];
                await sleep(Math.floor(Math.random() * 500) + 500);
                const botMessageSentDelay = (10000 * botMessage.length) / 70;
                botClientSocket.emit('typing', { chatId: 0, isTyping: true });
                await sleep(botMessageSentDelay);
                botClientSocket.emit("message", {
                    messageContent: botMessage,
                    chatId: 0,
                    identityKey: uuidv4()
                });

            }
        } catch (error) {
            console.log("An error occurred while sending bot messages:", error);
        }
    },
    async classifyMessage(message) {
        try {
            const classifier = await loadClassifier();
    
            let result = await classifier(message, validLabels);
            let label = result.labels[0];

            // If the label is not valid, retry once
            if (!validLabels.includes(label)) {
                result = await classifier(message, validLabels);
                label = result.labels[0];
            }

            return validLabels.includes(label) ? label : "convo";
        } catch (error) {
            console.log("\x1b[31mError occurred while labelling the message:\x1b[0m", error);
            return "convo";
        }
    },
    async labelMessage(message) {
        async function askHuggingFace(message) {
            let data = {
                inputs: message,
                parameters: {
                    candidate_labels: validLabels
                }
            }
            console.log("The data is: ", data);
            const response = await fetch(
                "https://router.huggingface.co/hf-inference/models/valhalla/distilbart-mnli-12-1",
                {
                    headers: {
                        Authorization: `Bearer ${process.env.HUGGING_FACE_ACCESS_TOKEN}`,
                        "Content-Type": "application/json",
                    },
                    method: "POST",
                    body: JSON.stringify(data),
                }
            );
            const result = await response.json();
            return result;
        }

        try {
            let result = await askHuggingFace(message);
            console.log("the hugging face result: ", result);
            let label = result?.labels && result.labels[0];

            if (!label || !validLabels.includes(label)) {
                result = await askHuggingFace(message);
                label = result?.labels && result.labels[0];
            }

            return validLabels.includes(label) ? label : "convo";
        } catch (error) {
            console.log("\x1b[31mError occurred while labelling the message:\x1b[0m", error);
            return "convo";
        }
    }
}