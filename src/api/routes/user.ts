import { Router } from 'express';
import { celebrate, Joi } from 'celebrate';
import cors from 'cors';

import config from '../../config';
import middlewares from '../middlewares';
const route = Router();
const corsOptions = { origin: config.domain.level };
// cors(corsOptions) // add this after '/:id/update',

export default (app: Router): void => {
  // Register our endpoint for this route-apis
  app.use('/:network/user', route);

  route.get('/:id', middlewares.userData);
  route.put(
    '/transaction/update',
    cors(corsOptions),
    celebrate({
      body: Joi.object({
        stashId: Joi.string(),
        network: Joi.string(),
        alreadyBonded: Joi.number(),
        stake: Joi.number(),
        transactionHash: Joi.string(),
        successful: Joi.boolean(),
      }),
    }),
    middlewares.updateTransactionData,
  );
};
