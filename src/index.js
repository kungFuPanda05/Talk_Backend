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


dotenv.config();
const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000"
  }))


app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(compression());
app.use(helmet());

app.use(passport.initialize());
app.use(expressSanitizer());


app.use('/api', sanitize(), restRouter);
app.get('/', (req, res)=>{
    res.send("This is the home page");
})
app.use((error, req, res, next) => {
    console.log("The error occured is: ", error);
    if(!(error instanceof RequestError)){
        error = new RequestError("Some Error Ocurred", 500, error.message);
    }
    res.status(error.status || 500).json({
        success: false,
        messages: error.errorList
    })
})

db.sequelize.authenticate()
.then(()=>{
    console.log("Database is working correctly");
    db.sequelize.sync();
})
.catch((err)=>{
    console.log(err, "Something went wrong with the Database!"); 
})

const PORT = process.env.APP_PORT || 4000;

const server = app.listen(PORT, ()=>{
    console.log(`The app is running on port ${PORT}`);
    db.User.update(
        { Online: 0 },  // Update value
        { where: {} }   // No conditions, update all users
      );
})

const io = require('socket.io')(server, {
    pingTimeout:60000,
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
    },
});

io.use(socketStrategy);
randomConnect(io);

export default io;