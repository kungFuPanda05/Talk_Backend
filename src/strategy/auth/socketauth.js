import passport from 'passport'

const socketStrategy = async (socket, next) => {
    const token = socket.handshake.auth?.token
        || socket.handshake.headers.authorization?.split(' ')[1];
    if(!token) return next(new RequestError("Invalid User", 401));

    // Passport's JWT extractor only reads the Authorization header. Native
    // clients send the same token through Socket.IO's auth payload instead.
    socket.handshake.headers.authorization = `Bearer ${token}`;

    passport.authenticate('jwt' , {session : false} , (err , user) => {
        if ((err && err === "user") || !user) {
            return next(new RequestError("UnAuthorized User", 401));
        }
        if (err) {
            return next(new RequestError(err));
        }
        socket.user = JSON.parse(JSON.stringify(user));
        next();
    })(socket.handshake , null , next);
}

export default socketStrategy;
