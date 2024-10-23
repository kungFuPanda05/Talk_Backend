import passport from 'passport'

const socketStrategy = async (socket, next) => {
    console.log("The socket is: ", socket);
    const token = socket.handshake.headers.authorization?.split(' ')[1];
    if(!token) next(new RequestError("Invalid User", 401));

    passport.authenticate('jwt' , {session : false} , (err , user) => {
        if (err && err == "user" || !user) {
            return next(new RequestError("UnAuthorized User", 401));
        }
        if (err) {
            return next(new RequestError(err));
        }
        socket.user = user;
        next();
    })(socket.handshake , null , next);
}

export default socketStrategy;