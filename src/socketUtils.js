export const socketWrapper = (func, socket) => {
    return async (...args) => {
        try {
            await func(...args);
        } catch (error) {
            console.log("Socket error:", error);
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
    };
};
