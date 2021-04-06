import { Router } from 'express';
import middlewares from '../middlewares';
const route = Router();

export default (app: Router): void => {
  // Register our endpoint for this route-apis
  app.use('/:network/twitter', route);

  route.get('/top-validator', middlewares.top_validator);
  route.get('/top-nominator', middlewares.top_nominator);
};
