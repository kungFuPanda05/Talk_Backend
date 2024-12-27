export const featurePermission = (feature) => {
    return async(req, res, next) => {
        try{
            let isFeatureExists = await db.User_Package.count({
                where: {
                    userId: req.user.id
                },
                include: [{
                    model: db.Package,
                    attributes: [],
                    include: [{
                        model: db.Parameter_Package,
                        attributes: [],
                        include: [{
                            model: db.Parameter,
                            attributes: [],
                            where: {
                                name: feature
                            }
                        }]
                    }]
                }]
            });
            if(isFeatureExists) next();
            else throw new RequestError("You don't have access to this feature, upgrade your plan", 400);

        }catch(error){
            next(error);
        }
    }
}