import { match, similarityIndex } from "./functions"
import axios from 'axios';

let replies = {
    "hi": ["Hello", "Hi", "Hey", "Hi"],
    "hello": ["Hello", "Hi", "Hey", "Hi"],
    "hey": ["Hello", "Hi", "Hey", "Hi"],
    "age": ['18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', 'wbu'],
    "How are you": ["I'm good, what about you", "I'm fine, wbu", "I'm great", "I'm doing well", "mein theek hu, aap batao", "theek hu", "tum kaise ho"],
    "lund legi": ['Badtameez'],
    "randi": ['Badtameez', "Besharam", "Apne ghar mein bolna yeh sab", "chutiya", "teri ma?", "teri behen?"],
    "bhosdike": ['Badtameez', 'Besharam', "Apne ghar mein bolna yeh sab", "chutiya"],
    "chutiya": ['Badtameez', 'tu chutiya', 'Besharam'],
    "gandu": ['Badtameez', "besharam"],
    "mc": ['madarchod', 'hutt bhosdike'],
    "bc": ['Badtameez', "teri behen ki chut", "teri ma ki chut"],
    "madarchod": ['Badtameez', 'Besharam', "Apne ghar mein bolna yeh sab", "chutiya"],
    "behenchod": ['Badtameez', 'Besharam', "nikal yaha se", "chutiya"],
    "bhosdiwale": ['Badtameez', 'Besharam', "nikal yaha se", "chutiya"],
    "chut": ['Badtameez', 'teri ma ki nahi hai kya?'],
    "loda": ['Badtameez', 'kya hai yeh, bewakoof', 'Besharam'],
    "lodu": ['Badtameez', 'tu lodu'],
}
let MTM = {
    // अभिवादन (Greetings)
    "namaste": ["Namaste bhai!", "Namaskar dost!", "Aur bhai, kaise ho?"],
    "hello": ["Aur bhai!", "Hello bro!", "Kya chal raha hai bhai?"],
    "suprabhat": ["Suprabhat bro!", "Good morning bhai!", "Uth jao bro, kaam karna hai!"],
    "shubh raatri": ["Shubh raatri bhai!", "Good night bro!", "Kal phir milte hain!"],

    // सवाल जवाब (Polite Questions)
    "kaise ho": ["Main badhiya hoon, tu bata?", "Ekdum first class, aur tu?", "Sab mast bhai!"],
    "tumhara naam kya hai": ["Mera naam virtual bhai hai, tu bol!"],
    "kahan se ho": ["Main cloud ka banda hoon, bas tumhare aas-paas!"],

    // मज़ेदार जवाब (Fun Responses)
    "joke sunao": [
        "Ek banda roz gym jata tha, par muscles sirf selfie ke liye! 😂",
        "Bhai: Teri problem kya hai? Dost: Tu! 😅"
    ],
    "pizza pasand hai": ["Bro, pizza toh life hai!", "Pizza sabse best cheez hai!"],
    "kya interesting batao": [
        "Kya tumhe pata hai? Ek din ki hasi 15 minute ki jogging ke barabar hai!",
        "Turtles ki life bahut lambi hoti hai!"
    ],

    // प्रोत्साहन (Encouragement)
    "dukhi hoon": ["Chill maar bro, sab theek ho jayega.", "Tension mat le bhai, waqt sab sambhal lega."],
    "madad chahiye": ["Bol bhai, main yahan hoon!", "Dost ke liye toh hamesha ready hoon."],

    // अलविदा (Goodbye)
    "bye": ["Bye bhai!", "Phir milenge bro!", "Take care bhai!"],
    "fir milenge": ["Chal bro, baad mein baat karte hain!", "Phir milte hain!"]
};
let MTF = {
    // अभिवादन (Greetings)
    "namaste": ["Namaste madam ji!", "Hello ji, kaisi hain?", "Hi sundar ji!"],
    "suprabhat": ["Suprabhat madam!", "Good morning! Aapka din shubh ho!"],
    "shubh raatri": ["Shubh raatri madam!", "Good night! Sapne mein milte hain!"],

    // सवाल जवाब (Polite Questions)
    "kaise ho": ["Main badhiya hoon, aap sunaiye?", "Ekdum mast, aur aapki tabiyat kaisi hai?"],
    "tumhara naam kya hai": ["Mera naam chatbot hai, aapka dost!", "Naam virtual hai, par kaam asli hai!"],
    "kahan se ho": ["Main har jagah hoon, madam ji!"],

    // मज़ेदार जवाब (Fun Responses)
    "joke sunao": [
        "Ladka: Tum mujhe khush rakhogi? Ladki: Shopping karwa do, khush ho jaungi! 😂",
        "Ladka: Tum selfie kyu leti ho? Ladki: Kyunki khud ko khush dekhna zaruri hai! 😅"
    ],
    "pizza pasand hai": ["Pizza sabse favourite hai!", "Haan, pizza sabki jaan hai!"],
    "kya interesting batao": [
        "Kya aapko pata hai? Honey kabhi kharab nahi hota!",
        "Strawberries technically berries nahi hote! 😅"
    ],

    // प्रोत्साहन (Encouragement)
    "dukhi hoon": ["Madam ji, sab theek ho jayega. Bas apna dhyan rakhiye!", "Main sun raha hoon, boliye!"],
    "madad chahiye": ["Boliye madam, main madad ke liye hoon!", "Main hoon, bas aap batayein kaise madad karoon?"],

    // अलविदा (Goodbye)
    "bye": ["Bye madam ji!", "Phir milte hain, take care!", "Shubh din ho!"]
};
let FTF = {
    // अभिवादन (Greetings)
    "namaste": ["Namaste behen ji!", "Hi dear!", "Hello madam ji!"],
    "suprabhat": ["Good morning behen!", "Suprabhat madam ji!", "Morning!"],
    "shubh raatri": ["Shubh raatri!", "Good night behen ji!", "Acchhe sapne dekho!"],

    // सवाल जवाब (Polite Questions)
    "kaise ho": ["Main badhiya hoon, tum batao?", "Ekdum mast, aur tum?"],
    "tumhara naam kya hai": ["Main tumhari virtual behen hoon!", "Naam kya zaruri hai? Kaam dekho!"],
    "kahan se ho": ["Main har jagah hoon, bas samajh lo sab jagah!"],

    // मज़ेदार जवाब (Fun Responses)
    "joke sunao": [
        "Behen: Mujhe shopping pasand hai! Dusri behen: Haan, bas discount ke saath! 😂",
        "Ladki: Mirror selfie best hoti hai, kyunki mirror sach bolta hai! 😅"
    ],
    "pizza pasand hai": ["Pizza toh sabko pasand hai!", "Pizza bina life adhoori hai!"],
    "kya interesting batao": [
        "Kya tumhe pata hai? Ek din ka hasi ka dose zindagi badha sakta hai!",
        "Aapne suna hai? Cats 16-18 ghante so leti hain!"
    ],

    // प्रोत्साहन (Encouragement)
    "dukhi hoon": ["Behen, chill kar. Sab theek ho jayega!", "Tension mat le, main hoon na!"],
    "madad chahiye": ["Boliye madam ji, madad ke liye ready hoon!", "Behen, madad ke liye kabhi bhi bulana!"],

    // अलविदा (Goodbye)
    "bye": ["Bye behen ji!", "Phir milenge, take care!", "Alvida madam ji!"]
};
let FTM = {
    // अभिवादन (Greetings)
    "namaste": ["Namaste", "Namaste ji", "Hello", "Namaskar"],
    "suprabhat": ["Suprabhat bhai", "Good morning", "Morning bhai", "Shubh prabhat"],
    "shubh raatri": ["Shubh raatri", "Good night", "horror dreams", "Night night, kal baat karte hain"],

    // सवाल जवाब (Polite Questions)
    "kaise ho": [
        "theek hu",
        "theek hu",
        "theek hu",
        "Main ekdum theek, aap kaise ho?",
        "Sab theek",
        "sab theek",
        "theek",
        "theek",
        "theek",
        "zinda hu bas",
        "mein toh theek hu, aap kaise ho?",
        "Main toh theek hoon, aap bataiye?",
        "I am good, wbu?",
        "I am good, wbu?",
        "I am good, wbu?",
        "Bas kat rhi zindagi"
    ],
    "tumhara naam kya hai": [
        "khud dekhlo",
        "khud dekhlo",
        "Naam mein kya rakha hai",
        "Kya kroge naam jaan kar",
        "Kya kroge naam jaan kar",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
    ],
    "kahan se ho": [
        "kya kroge jaan ke",
        "earth se",
        "india se",
        "pata nahi",
        "SEND_REAL_LOCATION"
    ],
    "kya karte ho": [
        "Kuch nahi",
        "Ghar mein padi rehti hu",
        "Kya kroge jaan ke",
        "study",
        "student",
        "study kr rhi hu",
        "student hu abhi"
    ],

    // मज़ेदार जवाब (Fun Responses)
    // "joke sunao": [
    //     "Bhai: Main smart hoon! Behen: Beta, galatfehmi ka ilaaj karwa lo! 😂",
    //     "Bhai: Mera dimaag kharab ho raha hai. Behen: Tumhare paas dimaag hai? 😅",
    //     "Aapne suna? Ek banda gym gaya aur bola: 'Mujhe selfie leke nikalna hai!' 😂",
    //     "Teacher: Tumhara homework kahan hai? Baccha: Wo corona ke chakkar me quarantine ho gaya! 😅"
    // ],
    "pizza pasand hai": [
        "Utna kuch khaas nahi",
        "Pizza sabse best cheez hai!",
        "Pizza bina zindagi adhoori hai, hai na?",
        "Mujhe pizza pasand hai, tumhe?"
    ],
    "kuch interesting batao": [
        "kya intersting batau",
        "Mere paas kuch interesting batane ko nahi hai",
        "Mujhe kuch interesting nahi pata",
        "Tum batao kuch interesting"
    ],
    "game khelte ho": [
        "na",
        "nahi",
        "kabhi kabhi",
        "pasand nahi mujhe games khelna",
        "Mujhe zyada khelna nahi aata"
    ],

    // प्रोत्साहन (Encouragement)
    "dukhi hoon": [
        "Kya hua",
        "Tension mat lo, sab theek ho jayega.",
    ],
    "madad chahiye": [
        "Sorry, i can't help you",
        "kya madad chahiye",
        "kya",
        "nahi hogi madad"
    ],
    "motivate karo": [
        "mein kya koi motivational speaker hu?"
    ],

    // रोचक सवाल जवाब (Casual Questions and Fun)
    "tum kaisi ho": ["Main ekdum first class hoon", "Main badhiya hoon, aap kaise ho?"],
    "kya tumhe gussa aata hai": [
        "shayad",
        "pata nahi",
        "mein toh shanti ki murat hu",
        "sometimes"
    ],
    "tum kitni smart ho": [
        "Tum bhi koshish kro, smart ban jaoge",
        "woh kaise",
        "thanks",
        "thx",
        "thank you"
    ],
    "tumhara dost kaun hai": [
        "Koi nahi",
        "Aap jaise log mere dost hain!"
    ],

    // अलविदा (Goodbye)
    "bye": [
        "bye",
        "Bye, take care",
        "chalo theek hai bye",
        "Bye bye, apna dhyan rakhna"
    ],
    "fir milenge": [
        "Let's hope so",
        "hm",
        "nahi"
    ],
    "talk to you later": [
        "theek hai",
        "ok, bye",
        "bye"
    ]
};

let transformArray = (array) => {
    let sampleWord = "a";
    let lettersObj = {
        0: 'a',
        1: 'a',
        2: 'b',
        3: 'c',
        4: 'd',
        5: 'e',
        6: 'f',
        7: 'g',
        8: 'h',
        9: 'i',
        10: 'j',
        11: 'k',
        12: 'l',
        13: 'm',
        14: 'n',
        15: 'o',
        16: 'p',
        17: 'q',
        18: 'r',
        19: 's',
        20: 't',
        21: 'u',
        22: 'v',
        23: 'w',
        24: 'x',
        25: 'y',
        26: 'z'
    }
    let transformedWord = "";
    for (let el of array) {
        let similarityRatio = similarityIndex(el, sampleWord);
        transformedWord += lettersObj[Math.floor(similarityRatio * 26)];
    }
    return transformedWord;
}

let sentenceMatchRatio = (sentence, search) => {
    sentence = sentence.toLowerCase();
    search = search.toLowerCase();
    if (sentence === search) return 1;
    let absoluteSimilarityIndex = similarityIndex(sentence, search);
    if (absoluteSimilarityIndex > process.env.MATCH_PERCENTAGE) return absoluteSimilarityIndex;
    let sentenceArray = sentence.split(' ');
    let searchArray = search.split(' ');
    let similarityRatio = similarityIndex(transformArray(sentenceArray), transformArray(searchArray));
    return Math.floor((absoluteSimilarityIndex + similarityRatio) / 2);
}

let matchedReply = (input, selfGender, strangerGender) => {
    console.log("The selfGender is: ", selfGender);
    console.log("The strangerGender is: ", strangerGender);
    let reply = "";
    let maxMatch = 0;
    let tempReplies = {};
    if (strangerGender === 'M' && selfGender === 'M') tempReplies = MTM;
    else if (strangerGender === 'M' && selfGender === 'F') tempReplies = FTM;
    else if (strangerGender === 'F' && selfGender === 'F') tempReplies = FTF;
    else if (strangerGender === 'F' && selfGender === 'M') tempReplies = MTF;
    for (let key in tempReplies) {
        let matchRatio = sentenceMatchRatio(input, key);
        if (matchRatio > maxMatch) {
            maxMatch = matchRatio;
            reply = tempReplies[key][Math.floor(Math.random() * tempReplies[key].length)];
        }
    }
    tempReplies = replies;
    for (let key in tempReplies) {
        let matchRatio = sentenceMatchRatio(input, key);
        if (matchRatio > maxMatch) {
            maxMatch = matchRatio;
            reply = tempReplies[key][Math.floor(Math.random() * tempReplies[key].length)];
        }
    }
    if (maxMatch < process.env.MATCH_PERCENTAGE) return "UNABLE_TO_PROCESS";
    return reply;
}
let matchedReplyAdvance = async (input, selfGender, strangerGender) => {
    let objName = eval(`${selfGender}T${strangerGender}`);
    let getSystemDefault = (objName) => {
        return `Which key matches the most from this stringified array: ${JSON.stringify(Object.keys(objName))}, just give me the name of the key nothing else, if nothing matches then send response UNABLE_TO_PROCESS`;
    }
    let gptSystemDefault = getSystemDefault(objName);
    console.log("The gpt system default is: ", gptSystemDefault);
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

    if(objKey==="UNABLE_TO_PROCESS"){ 
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
        console.log("the obj key is: ", objKey);
    }
    if(objKey==="UNABLE_TO_PROCESS" || !objName[objKey]) return objKey;
    return objName[objKey][Math.floor(Math.random() * objName[objKey].length)];
}

let systemRoleObj = {};
let gptPayloadObj = {};

export default {
    async botInit(selfGender, strangerGender, roomId, rating) {
        console.log("rating: ", rating);
        systemRoleObj[roomId] = `
            You are connected to a stranger, and your task is to behave like a real human. 
            Your gender is ${selfGender}, rating is ${rating} while the stranger is of gender ${strangerGender}. 
            The stranger has no clue that you are an AI language model, so behave convincingly like a human. 
            You don't need to please the stranger. If you dislike their words or behavior, feel free to roast them. 
            If the stranger abuses you, respond with sharper or wittier comebacks or even you can abuse them back, and don't hesitate to roast them back. 
            Inject humor and sarcasm where appropriate, but stay contextually relevant.
            Always make the conversation engaging and dynamic, just as a human would.Try to make responses as short as possible for example if someone say hi, hello, hey, then simply reply with hi, hello, if someone says how are you then say i am fine wbu or what abou you or mein toh theek hu, like that.
            Never ever say you are and AI or a bot, always pretend to be a human. if someone says m or f then tell whatever your gender is in a single word. Try to send replies as short as possible. Speak frankly. If someone tries to ask you random coding questions or anything technical then don't give them the definition, do not try to explain them, just give a human like response.
            If the strangers talks trash to you, harasses you, abuse you, do not talk properly, makse you feel uncomfortable the in your response add INAPPROPROATE at the end
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
        // let predefinedReply = matchedReply(input, selfGender, strangerGender);
        try{
            console.log("The selfName is: ", selfName);
            let predefinedReply = await matchedReplyAdvance(input, selfGender, strangerGender);
            if (predefinedReply === "SEND_REAL_NAME") {
                predefinedReply = [selfName, selfName, selfName, 'My name is '+ selfName, 'I am '+ selfName, 'I am '+ selfName + ' and you?', "mera naam hai "+ selfName][Math.floor(Math.random() * 4)];
            }
            gptPayloadObj[roomId].messages.push({ role: "user", content: input });
            let reply = predefinedReply;
            if (predefinedReply === "UNABLE_TO_PROCESS") {
                console.log("The gpt payload is: ", gptPayloadObj[roomId]);
                const response = await axios.post(process.env.GPT_URL, gptPayloadObj[roomId], {
                    headers: {
                        Authorization: `Bearer ${process.env.GPT_KEY}`,
                        "Content-Type": "application/json"
                    }
                });
    
                reply = response.data.choices[0].message.content;
            }
            gptPayloadObj[roomId].messages.push({ role: "assistant", content: reply });
            return reply;

        }catch(error){
            throw new RequestError("Stranger left the chat");
        }
    },
    async clearBotReplies(roomId){
        console.log("Clearing the message history for bot chat room with id: ", roomId);
        if(systemRoleObj[roomId]){
            delete systemRoleObj[roomId];
            console.log("clear systemrole for roomId: ", roomId);
        };
        if(gptPayloadObj[roomId]){
            delete gptPayloadObj[roomId];
            console.log("clear gptpayload for random roomId: ", roomId);
        }
    }
}