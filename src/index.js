import express from 'express';
import passport from 'passport';
import { restRouter } from "./api";
import cors from 'cors';
import './passport';
import db from '../models';
import randomConnect from './randomConnLogic';
import socketStrategy from './strategy/auth/socketauth';
import expressSanitizer from 'express-sanitizer'
import './errors'
import { sanitize } from './middleware/sanitizer';
import dotenv from 'dotenv';
import compression from 'compression';
import helmet from 'helmet';
import path from 'path';


dotenv.config();
const app = express();

app.options('*', cors()); // Enable CORS preflight for all routes
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000"
}))


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(helmet());

app.use(passport.initialize());
app.use(expressSanitizer());
app.use('/uploads', express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, path) => {
        res.set('Content-Type', 'image/jpeg'); // Set appropriate MIME type
    }
}));

app.use((req, res, next) => {
    console.log(`\x1b[31m${req.method}\x1b[0m \x1b[32m${req.url}\x1b[0m`);
    next();
});

app.use('/api', sanitize(), restRouter);
app.get('/', (req, res) => {
    res.send("This is the home page");
})
app.use((error, req, res, next) => {
    console.log("The error occured is: ", error);
    if (!(error instanceof RequestError)) {
        error = new RequestError("Some Error Ocurred", 500, error.message);
    }
    res.status(error.status || 500).json({
        success: false,
        messages: error.errorList
    })
})

db.sequelize.authenticate()
    .then(() => {
        console.log("Database is working correctly");
    })
    .catch((err) => {
        console.log(err, "Something went wrong with the Database!");
    })

const PORT = process.env.APP_PORT || 4000;

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`The app is running on port ${PORT}`);
    db.User.update(
        { Online: 0 },  // Update value
        { where: {} }   // No conditions, update all users
    );
});


const io = require('socket.io')(server, {
    pingTimeout: 60000,
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
    },
});

io.use(socketStrategy);
randomConnect(io);

export default io;