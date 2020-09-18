import { Router } from 'express';
import { celebrate, Joi } from 'celebrate';
// import cors from 'cors';

// import config from '../../config';
import middlewares from '../middlewares';
const route = Router();

// const corsOptions = { origin: config.domain };
// cors(corsOptions) // add this after '/:id/update',

export default (app: Router) => {
  // Register our endpoint for this route-apis
  app.use('/validator', route);

  route.get('/multi', middlewares.validatorsInfo);
  route.get('/:id', middlewares.validatorProfile);

  route.put(
    '/:id/update',
    celebrate({
      body: Joi.object({
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
