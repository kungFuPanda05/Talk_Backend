import express from 'express';
import db from '../../../models'
import { logoUpload } from '../../middleware/multer-config';
import { validateBody } from '../../middleware/validator';
import Joi from 'joi';
const apiRouter = express.Router();
// logoUpload.single('logo')

const validator = Joi.object().keys({
    name: Joi.string().required(),                      
    gender: Joi.string().valid('M', 'F').required(),      
    email: Joi.string().email().required(),              
    password: Joi.string().min(8).required(),
    logo: Joi.string()
});

let controller = async (req, res, next)=>{
    try{
        let {name, gender, email, password} = req.body;
        // console.log("req.body: ", req.body);
        let user = await db.User.findOne({where: {email}});
        if(user) throw new RequestError("The user already exists, try login", 409);
        const pic = req.file? req.file.path : null;
        console.log("PIC: ", pic);

        console.log("name: ", name);
        console.log("gender: ", gender);
        console.log("email: ", email);
        console.log("password: ", password);
        console.log("pic: ", pic);

        let createdUser = await db.User.create({name, gender, email, password, pic})
        if(!createdUser) throw new RequestError("The User has not created");

        return res.status(200).json({
            success: true,
            message: "User Created Successfully"
        })
    }catch(error){
        next(error);
    }
}

apiRouter.route('/').post(logoUpload.single('logo'), validateBody(validator), controller); //multer should be before validateBody because it populates the req.body and if it is written after validatebody then the validator won't have any data in req.body and it will throw the error

export default apiRouter;