import { Router } from 'express';
import middlewares from '../middlewares';
const route = Router();

export default (app: Router): void => {
  // Register our endpoint for this route-apis
  app.use('/rewards', route);

  route.get('/max-set', middlewares.max_set);
  route.get('/risk-set', middlewares.risk_set);
};
