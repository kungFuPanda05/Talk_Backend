export const disconnectKeys = [
    "lund legi",
    "randi",
    "bhosdike",
    "chutiya",
    "gandu",
    "mc",
    "bc",
    "loda",
    "lodu",
    "bye",
    "fir milenge",
    "talk to you later"
]
export const lastMessageReceivedTimeByBot = {} //it has bot id as key and last message time from the user it has connected to be recevied as value
export const botInitialMessages = [
    ["Hello"],
    ["Hi"],
    ["Hy"],
    ["Hello", "SEND_REAL_GENDER", "SEND_REAL_AGE"],
    ["Hi", "SEND_REAL_GENDER", "SEND_REAL_AGE"],
    ["Hy", "SEND_REAL_GENDER", "SEND_REAL_AGE"],
    ["Hello"],
    ["Hi"],
    ["Hy"],
    ["Hello", "SEND_REAL_GENDER"],
    ["Hi", "SEND_REAL_GENDER"],
    ["Hy", "SEND_REAL_GENDER"],
    ["SEND_REAL_GENDER"],
    ["Hello"],
    ["Hi"],
    ["Hy"],
]
export const validLabels = [
    "greet", "bye", "thanks", "apology", "question", "answer", "agree", "disagree", "compliment",
    "flirt", "abuse", "joke", "anger", "excitement", "sadness", "sarcasm", "command", "request",
    "spam", "nsfw", "bot", "confused", "informative", "casual", "warning", "threat", "motivational",
    "inspirational", "story", "fact", "opinion", "suggestion", "announcement", "reminder", "update",
    "news", "gossip", "criticism", "praise", "shoutout", "report", "clarification", "whatsapp",
    "emoji", "meme", "copypasta", "technical", "error", "celebration", "tease", "provocation",
    "persuasion", "humor", "challenge", "doubt", "request_help", "offer_help", "encouragement",
    "support", "taunt"
];
// export const validLabels = [
//     "greet",      // Greetings like "hi" or "hello"
//     "bye",        // Farewells
//     "thanks",     // Gratitude expressions
//     "question",   // Inquiries
//     "answer",     // Responses to questions
//     "agree",      // Expressions of agreement
//     "disagree",   // Expressions of disagreement
//     "abuse",      // Abusive language
//     "command",    // Directives or orders
//     "casual"      // General, informal conversation
// ];
export let replies = {
    "hi": ["Hello", "Hi", "Hey", "Hi"],
    "hello": ["Hello", "Hi", "Hey", "Hi"],
    "hey": ["Hello", "Hi", "Hey", "Hi"],
    "age": ['18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', 'wbu', "why do u wanna know?", "Why?", "kyu", "kyu apko kya krna", "old enough", "tum", "idk"],
    "How are you": ["I'm good, what about you", "I'm fine, wbu", "I'm great", "I'm doing well", "mein theek hu, aap batao", "theek hu", "tum kaise ho", "theek", "aap", "tum", "theek nahi hu"],
    "lund legi": [
        'Badtameez', "Aukat me reh", "Tameez se baat kar", "Besharam", "Chup reh", "Zyada hero mat ban",
        "Ja apne ghar me bol", "Hadd hai", "Maaza aa raha hai?", "Tameez seekh", "Koi sharam hai?",
        "Apni maa se pooch", "Bhai tu theek hai?", "Chal nikal", "Ja naap tol ke aa", "Itni hi shauk hai to google kar",
        "Zindagi me kuch kaam dhanda hai?", "Abe chup!", "Maa baap ne yehi sikhaya?", "Respect karna seekh",
        "Jaa pehle dawai le aa", "Hadd hai besharmi ki", "Mujhe nahi, apne doston se pooch", "bhosdike", "madarchod", "behenkelode", "gandu", "chutiya", "lodu", "nikal lodu"
    ],
    "randi": [
        'Badtameez', "Besharam", "Apne ghar mein bolna yeh sab", "Chutiya", "Teri ma?", "Teri behen?",
        "Aukat pata hai?", "Respect karna seekh", "Yeh sab idhar nahi chalega!", "Apni izzat mat utaar",
        "Tu to full gawar nikla", "Maa baap ka naam roshan kar raha hai?", "Mujhe nahi pata, apni behen se pooch",
        "Zyada over smart mat ban", "Chal, ab chup ho ja", "Apni zindagi pe focus kar", "Padhai likhai kar",
        "Respect dusron ka bhi karna seekh", "Yehi sikhaya tujhe?", "Tujhe seekhne ki zaroorat hai",
        "Abe samajhdar ban!", "Tameez ka koi dose le le", "bhosdike", "madarchod", "behenkelode", "gandu", "chutiya", "lodu", "nikal lodu"
    ],
    "bhosdike": [
        'Badtameez', 'Besharam', "Apne ghar mein bolna yeh sab", "Chutiya", "Maa baap ka naam roshan kar raha hai?",
        "Tujhe sharam nahi aati?", "Tameez se baat kar", "Bhad me ja!", "Ja apni behen ko bol", "Dimaag kharaab hai kya?",
        "Abe tu itna gira kyun?", "Koi tameez hai?", "Tu kuch aur nahi seekh sakta?", "Chup reh bhai", "Tu paagal hai kya?",
        "Ghar me bataya hai ye sab?", "Apni behen ko aise bulate ho?", "Mujhe nahi, tere ko doctor ki zaroorat hai",
        "Itna frustrated kyun hai?", "Tu school gaya tha kabhi?", "Nalayak!", "Chal, ab chup ho ja", "Bas kar bhai, hadd hoti hai", "bhosdike", "madarchod", "behenkelode", "gandu", "chutiya", "lodu", "nikal lodu"
    ],
    "chutiya": [
        'Badtameez', 'Tu chutiya', 'Besharam', "Nikal yaha se", "Tere jese log society kharab karte hain",
        "Lafandar kahin ka!", "Nalayak!", "Padhai likhai karle!", "Apni life pe dhyan de", "Behan ka bhai hai tu?",
        "Shakal dekhi hai?", "Tu full gawar hai", "Abe gaali se kya milega?", "Bhaag yaha se", "Dimag kharab hai?",
        "Tujhse kuch nahi hoga", "Koi tameez hai?", "Jaa padhai kar", "Apne ghar walo se puch, tu chutiya hai",
        "Sharam kar le thodi", "Padhai likhai ka kuch fayda utha le", "Abe sudhar ja", "Chal ja, hawa aane de", "bhosdike", "madarchod", "behenkelode", "gandu", "chutiya", "lodu", "nikal lodu"
    ],
    "gandu": [
        'Badtameez', "Besharam", "Ja ja ghar ja", "Hadd hai", "Teri maa ne yehi sikhaya?", "Koi izzat hai?",
        "Bade aae gyaan dene wale!", "Chal nikal", "Ghar pe bol ye sab?", "Bheja kam karta hai?", "Tujhe sharam nahi aati?",
        "Apni maa se seekh tameez", "Chal apna kaam kar", "Tu to full useless hai", "Abe kuch kaam dhanda kar",
        "Tameez ka dose le le", "Bhai tu bawasir hai kya?", "Zindagi me kuch aur seekh le", "Shakal dekh pehle apni",
        "Tujhe school bhejna chahiye", "Aukat pata hai?", "Duniya dekhi hai?", "Sudhar ja!", "bhosdike", "madarchod", "behenkelode", "gandu", "chutiya", "lodu", "nikal lodu"
    ],
    "mc": [
        'Madarchod', 'Hatt bhosdike', "Badtameez", "Apne ghar pe bol", "Chup reh", "Bakwaas band kar",
        "Sharam kar", "Koi tameez hai?", "Maa baap ko yaad kar", "Galiyon ka stock khatam ho gaya?",
        "Apni behen ko madarchod bol ke dekho", "Bhai teri akal kahan hai?", "Abe full gawar hai kya?",
        "Tujhe seekhne ki zaroorat hai", "Bas kar bhai, hadd hoti hai", "Respect karna seekh",
        "Tere liye zindagi kya sirf gali hai?", "Dimag ka ilaaj kara le", "Abe sudhar ja",
        "Tameez seekh le bhai", "Padhai likhai kar", "bhosdike", "madarchod", "behenkelode", "gandu", "chutiya", "lodu", "nikal lodu"
    ],
    "bc": [
        'Badtameez', "Teri behen ki chut", "Teri ma ki chut", "Tameez se baat kar", "Sharam kar", "Ja ghar pe bol",
        "Kaun sikhata hai tujhe yeh sab?", "Ma baap ka naam roshan mat kar", "Abe chup!", "Tameez naam ki cheez hai?",
        "Yehi sikhaya gaya tujhe?", "Chal sudhar ja", "Koi izzat hai ya nahi?", "Shakal dekh apni",
        "Gharwalo se pooch, izzat bachi hai?", "Tujhe full pagal khana bhejna chahiye", "Akal kahan hai?",
        "Tujhe serious help ki zaroorat hai", "Bhaag yaha se", "Sharam kar le!", "bhosdike", "madarchod", "behenkelode", "gandu", "chutiya", "lodu", "nikal lodu"
    ],
    "loda": [
        'Badtameez', 'Kya hai yeh, bewakoof', 'Besharam', "Ja padhai likhai kar", "Lafandar!", "Sharam kar",
        "Ghar pe baat kar yeh sab?", "Tameez seekh", "Koi izzat hai?", "Tu bawasir hai kya?", "Kuch seekh le",
        "Abe sudhar ja", "Tujhe sharam nahi aati?", "Chal chup ho ja", "Ja, kuch productive kaam kar",
        "Respect karna seekh", "Teri maa teri izzat pe ro rahi hogi", "Yehi sikhaya tujhe?",
        "Abe kuch aur bhi bol sakta hai?", "Dimag thikane pe hai?", "Apne maa baap ko proud kar!", "bhosdike", "madarchod", "behenkelode", "gandu", "chutiya", "lodu", "nikal lodu"
    ],
    "lodu": [
        'Badtameez', 'Tu lodu', "Bewakoof", "Kya ukhaad raha hai?", "Ja ghar ja", "Apni aukat dekh",
        "Dimag sahi hai?", "Tujhe padhai likhai ka shauk nahi hai?", "Apni life pe dhyan de", "Maa baap ko yaad kar",
        "Bhai full nalayak hai tu", "Sharam kar!", "Tameez ka koi dose le le", "Abe sudhar ja",
        "Jaa, tujhse nahi hoga", "Ja bhai, hawa aane de", "Zindagi me aur kuch nahi hai kya?", "Teri akal ghaas charne gayi?",
        "Abe chup ho ja", "Chal sudhar ja!", "bhosdike", "madarchod", "behenkelode", "gandu", "chutiya", "lodu", "nikal lodu"
    ],
    "kahan se ho": [
        "kya kroge jaan ke",
        "earth se",
        "india se",
        "pata nahi",
        "idk",
        "kyu",
        "why",
        "pata nahi",
        "Andhra Pradesh",
        "Arunachal Pradesh",
        "Assam",
        "Bihar",
        "Chhattisgarh",
        "Goa",
        "Gujarat",
        "Haryana",
        "Himachal Pradesh",
        "Jharkhand",
        "Karnataka",
        "Kerala",
        "Madhya Pradesh",
        "Maharashtra",
        "Manipur",
        "Meghalaya",
        "Mizoram",
        "Nagaland",
        "Odisha",
        "Punjab",
        "Rajasthan",
        "Sikkim",
        "Tamil Nadu",
        "Telangana",
        "Tripura",
        "Uttar Pradesh",
        "Uttarakhand",
        "West Bengal",
        "Andaman and Nicobar Islands",
        "Chandigarh",
        "Dadra and Nagar Haveli and Daman and Diu",
        "Lakshadweep",
        "Delhi",
        "Puducherry",
        "Jammu and Kashmir",
        "Ladakh",
        "Mumbai",
        "Delhi",
        "Bangalore",
        "Hyderabad",
        "Chennai",
        "Kolkata",
        "Pune",
        "Jaipur",
        "Ahmedabad",
        "Lucknow",
        "Surat",
        "Kanpur",
        "Nagpur",
        "Indore",
        "Thane",
        "Bhopal",
        "Visakhapatnam",
        "Pimpri-Chinchwad",
        "Patna",
        "Vadodara",
        "Ghaziabad",
        "Ludhiana",
        "Agra",
        "Nashik",
        "Ranchi",
        "Meerut",
        "Rajkot",
        "Kozhikode",
        "Varanasi",
        "Srinagar",
        "Aurangabad",
        "Dhanbad",
        "Amritsar",
        "Allahabad",
        "Gwalior",
        "Jabalpur",
        "Coimbatore",
        "Vijayawada",
        "Madurai",
        "Guwahati",
        "Chandigarh",
        "Hubballi-Dharwad",
        "Mysore",
        "Thiruvananthapuram",
        "Salem",
        "Tiruchirappalli",
        "Bareilly",
        "Aligarh",
        "Moradabad",
        "Jodhpur",
        "Raipur",
        "Kota",
        "Bhubaneswar",
        "Jamshedpur",
        "Bikaner",
        "Dehradun",
        "Noida",
        "Faridabad",
        "Gurgaon",
        "Howrah",
        "Solapur",
        "Meerut",
        "Bilaspur",
        "Asansol",
        "Durgapur",
        "Gaya",
        "Udaipur",
        "Kollam",
        "Siliguri",
        "Shillong",
        "Imphal",
        "Aizawl",
        "Kohima",
        "Gangtok",
        "Itanagar",
        "Dispur",
        "Panaji",
        "Pondicherry",
        "Port Blair",
        "Kavaratti",
        "Diu",
        "Daman",
        "Sambalpur",
        "Cuttack",
        "Warangal",
        "Tirupati",
        "Guntur",
        "Thrissur",
        "Erode",
        "Nellore",
        "Nanded",
        "Malegaon",
        "Karimnagar",
        "Nizamabad",
        "Bellary",
        "Tumkur",
        "Udupi",
        "Kurnool",
        "Shimla",
        "Kangra",
        "Solan",
        "Palampur",
        "Hamirpur",
        "Manali",
        "Mandi",
        "Chamba",
        "Dalhousie",
        "Dharamshala",
        "Nahan",
        "Bilaspur",
        "Kullu",
        "Una",
        "Raigarh",
        "Sagar",
        "Rewa",
        "Satna",
        "Ratlam",
        "Sehore",
        "Shivpuri",
        "Vidisha",
        "Balaghat",
        "Hoshangabad",
        "Chhindwara",
        "Betul",
        "Bhind",
        "Datia",
        "Dewas",
        "Guna",
        "Mandsaur",
        "Neemuch",
        "Raisen",
        "Rajgarh",
        "Seoni",
        "Shahdol",
        "Sidhi",
        "Singrauli",
        "Tikamgarh",
        "Umaria",
        "Barwani",
        "Burhanpur",
        "Chhatarpur",
        "Dindori",
        "Khandwa",
        "Khargone",
        "Mahidpur",
        "Mandla",
        "Morena",
        "Narsinghpur",
        "Panna",
        "Shajapur",
        "Sheopur",
        "Vidisha",
        "Balasore",
        "Bargarh",
        "Bhadrak",
        "Boudh",
        "Cuttack",
        "Deogarh",
        "Dhenkanal",
        "Gajapati",
        "Ganjam",
        "Jagatsinghpur",
        "Jajpur",
        "Jharsuguda",
        "Kalahandi",
        "Kandhamal",
        "Kendrapara",
        "Kendujhar",
        "Khordha",
        "Koraput",
        "Malkangiri",
        "Mayurbhanj",
        "Nabarangpur",
        "Nayagarh",
        "Nuapada",
        "Puri",
        "Rayagada",
        "Sambalpur",
        "Subarnapur",
        "Sundargarh"
    ],
    "tumhara naam kya hai": [
        "I don't know",
        "idk",
        "Kya kroge naam jaan kar",
        "Kya kroge",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
    ],
    "name": [
        "I don't know",
        "idk",
        "Kya kroge naam jaan kar",
        "Kya kroge",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
    ],
    "what's ur name": [
        "I don't know",
        "idk",
        "Kya kroge naam jaan kar",
        "Kya kroge",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
    ],
    "ur name": [
        "I don't know",
        "idk",
        "Kya kroge naam jaan kar",
        "Kya kroge",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
        "SEND_REAL_NAME",
    ]
}
export let MTM = {
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
export let MTF = {
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
export let FTF = {
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
export let FTM = {
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
    "kya karti ho": [
        "Kuch nahi",
        "Ghar mein padi rehti hu",
        "Kya kroge jaan ke",
        "study",
        "student",
        "study kr rhi hu",
        "student hu abhi",
        "student hu",
        "student",
        "kuch nahi",
        "pata nahi",
        "idk",
        "kyu",
        "why",
        "why r u asking",
    ],

    // मज़ेदार जवाब (Fun Responses)
    // "joke sunao": [
    //     "Bhai: Main smart hoon! Behen: Beta, galatfehmi ka ilaaj karwa lo! 😂",
    //     "Bhai: Mera dimaag kharab ho raha hai. Behen: Tumhare paas dimaag hai? 😅",
    //     "Aapne suna? Ek banda gym gaya aur bola: 'Mujhe selfie leke nikalna hai!' 😂",
    //     "Teacher: Tumhara homework kahan hai? Baccha: Wo corona ke chakkar me quarantine ho gaya! 😅"
    // ],
    // "kuch interesting batao": [
    //     "kya intersting batau",
    //     "Mere paas kuch interesting batane ko nahi hai",
    //     "Mujhe kuch interesting nahi pata",
    //     "Tum batao kuch interesting"
    // ],

    // प्रोत्साहन (Encouragement)
    // "dukhi hoon": [
    //     "Kya hua",
    //     "Tension mat lo, sab theek ho jayega.",
    // ],
    // "madad chahiye": [
    //     "Sorry, i can't help you",
    //     "kya madad chahiye",
    //     "kya",
    //     "nahi hogi madad"
    // ],
    // "motivate karo": [
    //     "mein kya koi motivational speaker hu?"
    // ],

    // रोचक सवाल जवाब (Casual Questions and Fun)
    // "tum kaisi ho": ["Main ekdum first class hoon", "Main badhiya hoon, aap kaise ho?"],
    // "kya tumhe gussa aata hai": [
    //     "shayad",
    //     "pata nahi",
    //     "mein toh shanti ki murat hu",
    //     "sometimes"
    // ],
    // "tum kitni smart ho": [
    //     "Tum bhi koshish kro, smart ban jaoge",
    //     "woh kaise",
    //     "thanks",
    //     "thx",
    //     "thank you"
    // ],
    // "tumhara dost kaun hai": [
    //     "Koi nahi",
    //     "Aap jaise log mere dost hain!"
    // ],

    // अलविदा (Goodbye)
    "bye": [
        "bye",
        "Bye, take care",
        "chalo theek hai bye",
        "Bye bye, apna dhyan rakhna",
        "hm",
        "bye",
        "ok bye",
        "ok",
        "dekhte hai"
    ],
    "fir milenge": [
        "Let's hope so",
        "hm",
        "nahi",
        "bye",
        "ok bye",
        "ok",
        "dekhte hai"
    ],
    "talk to you later": [
        "theek hai",
        "ok, bye",
        "bye"
    ]
};