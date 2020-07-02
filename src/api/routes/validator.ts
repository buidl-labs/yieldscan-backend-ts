import { Router } from 'express';
import middlewares from '../middlewares';
const route = Router();

export default (app: Router) => {
  // Register our endpoint for this route-apis
  app.use('/validator', route);

  route.get('/:id', middlewares.validatorProfile);
};
