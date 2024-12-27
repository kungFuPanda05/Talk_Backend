import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';
import { Op } from 'sequelize';
import dbFunctions from '../../dbFunctions';
import Joi from 'joi';
import { validateBody } from '../../middleware/validator';

const validator = Joi.object({
    packageId: Joi.number().integer().required()
});


let controller = async (req, res, next)=>{

    try{
        let {packageId} = req.params;
        let packageRecord = await db.Package.findOne({
            attributes: ['id', 'duration', 'coins'],
            where: {
                id: packageId
            }
        });
        if(!packageRecord) throw new RequestError("This package doesn't exists", 400);
        
        let userPackage = await db.User_Package.findOne({
            attributes: ['expiredAt'],
            where: {
                packageId: packageRecord.id,
                userId: req.user.id
            }
        });
        if(userPackage && (new Date())<(new Date(userPackage.expiredAt))) throw new RequestError("This package has already been assigned to the user", 409);
        else if(userPackage) {
            await db.User_Package.destroy({
                where: {
                    id: userPackage.id
                }
            })
        }

        let packageExpiration = new Date();
        packageExpiration.setDate(packageExpiration.getDate() + packageRecord.duration);
        

        await dbFunctions.createUnique(db.User_Package, {userId: req.user.id, packageId, expiredAt: packageExpiration});
        await db.User.update({
            coins: packageRecord.coins
        }, {
            where: {
                id: req.user.id
            }
        })
        res.status(200).json({
            success: true,
            messages: 'Package Assigned Successfully',
        });
    }catch(error){
        next(error);
    }
}

const apiRouter = express.Router();
apiRouter.route('/:packageId').post(jwtStrategy, validateBody(validator), controller);
export default apiRouter;

