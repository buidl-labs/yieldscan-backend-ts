import { Router } from 'express';
import { celebrate, Joi } from 'celebrate';
import cors from 'cors';

import config from '../../config';
import middlewares from '../middlewares';
const route = Router();

const corsOptions = { origin: config.domain };
export default (app: Router) => {
  // Register our endpoint for this route-apis
  app.use('/validator', route);

  route.get('/:id', middlewares.validatorProfile);

  route.post(
    '/:id/update',
    cors(corsOptions),
    celebrate({
      body: Joi.object({
        stashId: Joi.string().required(),
        connectedStashId: Joi.string().required(),
        vision: Joi.string(),
        members: Joi.array().items(
          Joi.object({
            member: Joi.string(),
            role: Joi.string(),
            twitter: Joi.string(),
          }),
        ),
      }),
    }),
    middlewares.updateProfile,
  );
};
