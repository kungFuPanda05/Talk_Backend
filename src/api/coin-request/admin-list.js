import express from 'express';
import Joi from 'joi';
import db from '../../../models';
import jwtStrategy from '../../strategy/auth/jwtauth';
import adminOnly from '../../middleware/adminOnly';

const validator = Joi.object({
    status: Joi.string().valid('pending', 'approved', 'rejected').default('pending'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(25)
});

const controller = async (req, res, next) => {
    try {
        const { value, error } = validator.validate(req.query);
        if (error) throw new RequestError(error.details.map((detail) => detail.message), 400);

        const { rows, count } = await db.Coin_Request.findAndCountAll({
            attributes: ['id', 'requestedCoins', 'status', 'reviewedAt', 'adminNote', 'createdAt', 'updatedAt'],
            where: { status: value.status },
            include: [{
                model: db.User,
                as: 'Requester',
                attributes: ['id', 'name', 'gender', 'coins', 'isGuest']
            }],
            order: [['createdAt', 'ASC']],
            limit: value.limit,
            offset: (value.page - 1) * value.limit
        });

        const requests = rows.map((requestRecord) => {
            const request = requestRecord.get({ plain: true });
            if (request.Requester) request.Requester.isGuest = Boolean(request.Requester.isGuest);
            return request;
        });

        res.status(200).json({
            success: true,
            requests,
            pagination: {
                page: value.page,
                limit: value.limit,
                total: count
            }
        });
    } catch (error) {
        next(error);
    }
};

const apiRouter = express.Router();
apiRouter.route('/').get(jwtStrategy, adminOnly, controller);

export default apiRouter;
