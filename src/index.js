import 'dotenv/config';
import express from 'express';
import passport from 'passport';
import { restRouter } from "./api";
import cors from 'cors';
import './errors';
import './passport';
import db from '../models';
import randomConnect from './randomConnLogic';
import socketStrategy from './strategy/auth/socketauth';
import expressSanitizer from 'express-sanitizer'
import { sanitize } from './middleware/sanitizer';
import compression from 'compression';
import helmet from 'helmet';
import { expressCorsOptions, socketCorsOptions } from './corsOrigins';
import { redisEnabled } from './redis';
import { uploadRoot } from './uploadStorage';

const app = express();

app.options('*', cors(expressCorsOptions));
app.use(cors(expressCorsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(helmet());

app.use(passport.initialize());
app.use(expressSanitizer());
app.use('/uploads', express.static(uploadRoot, {
    setHeaders: (res) => {
        // Uploaded images are public chat assets. These headers allow the deployed
        // frontend (and its image optimizer) to render them across origins.
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    }
}));


app.use((req, res, next) => {
    console.log(`\x1b[31m${req.method}\x1b[0m \x1b[32m${req.url}\x1b[0m`);
    next();
});

app.get('/health', async (req, res) => {
    try {
        await db.sequelize.authenticate();
        res.status(200).json({
            status: 'ok',
            database: 'ready',
        });
    } catch (error) {
        res.status(503).json({
            status: 'unavailable',
            database: 'not_ready',
        });
    }
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
    .then(async() => {
        console.log("Database is working correctly");
    })
    .catch((err) => {
        console.log(err, "Something went wrong with the Database!");
    })

const PORT = process.env.PORT || process.env.APP_PORT || 4000;

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`The app is running on port ${PORT}`);
    db.User.update(
        { Online: 0 },  // Update value
        { where: {} }   // No conditions, update all users
    ).catch((error) => {
        console.error('Unable to reset user presence during startup:', error.message);
    });
});


const io = require('socket.io')(server, {
    pingTimeout: 60000,
    cors: socketCorsOptions,
});

if (redisEnabled) {
    require('./worker');
} else {
    console.log('Redis-backed bot and chat-context queues are disabled');
}

io.use(socketStrategy);
randomConnect(io);

export default io;
