import { Router } from 'express';
import middlewares from '../middlewares';
const route = Router();

export default (app: Router): void => {
  // Register our endpoint for this route-apis
  app.use('/kusama/rewards', route);
  app.use('/polkadot/rewards', route);

  route.get('/risk-set-only', middlewares.risk_set_only);
  route.get('/risk-set', middlewares.risk_set);
};
