import express from 'express';
import passport from 'passport';
import { restRouter } from "./api";
import cors from 'cors';
import './passport';
import db from '../models';
import randomConnect from './randomConnLogic';
const app = express();

app.use(cors({
    origin: 'http://localhost:3000'
  }))


app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(passport.initialize());

app.use('/api', restRouter);
app.get('/', (req, res)=>{
    res.send("This is the home page");
})

db.sequelize.authenticate()
.then(()=>{
    console.log("Database is working correctly");
})
.catch((err)=>{
    console.log(err, "Something went wrong with the Database!");
})

const PORT = 4000;

const server = app.listen(PORT, ()=>{
    console.log(`The app is running on port ${PORT}`);
})

const io = require('socket.io')(server, {
    pingTimeout:60000,
    cors: {
        origin: "http://localhost:3000",
    },
});

randomConnect(io);