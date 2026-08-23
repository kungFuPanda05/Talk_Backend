const adminOnly = (req, res, next) => {
    if (!req.user?.isAdmin) {
        return next(new RequestError('Admin access is required', 403));
    }

    next();
};

export default adminOnly;
