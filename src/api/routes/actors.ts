import { Router } from 'express';
import middlewares from '../middlewares';
const route = Router();

export default (app: Router): void => {
  // Register our endpoint for this route-apis
  app.use('/:network/actors', route);

  route.get('/validators', middlewares.validatorsDashboard);
  route.get('/waiting', middlewares.waitingDashboard);
  route.get('/nominators', middlewares.nominatorsDashboard);
  route.get('/nominator/stats', middlewares.nominatorStats);
  route.get('/nominator/history', middlewares.nominatorHistory);
};
