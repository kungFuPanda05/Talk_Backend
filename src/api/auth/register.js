import express from 'express';
import db from '../../../models'
import { logoUpload } from '../../middleware/multer-config';
const apiRouter = express.Router();
// logoUpload.single('logo')


let controller = async (req, res, next)=>{
    try{
        let {name, gender, email, password} = req.body;
        // console.log("req.body: ", req.body);
        let user = await db.User.findOne({where: {email}});
        if(user) throw new Error("The user already exists, try login");
        const pic = req.file? req.file.path : null;
        console.log("PIC: ", pic);

        console.log("name: ", name);
        console.log("gender: ", gender);
        console.log("email: ", email);
        console.log("password: ", password);
        console.log("pic: ", pic);

        let createdUser = await db.User.create({name, gender, email, password, pic})
        if(!createdUser) throw new Error("The User has not created");

        return res.status(200).json({
            success: true,
            message: "User Created Successfully"
        })
    }catch(error){
        next(error);
    }
}

apiRouter.route('/').post(logoUpload.single('logo'), controller);

export default apiRouter;