import { Router } from 'express';
import middlewares from '../middlewares';
const route = Router();

export default (app: Router) => {
  // Register our endpoint for this route-apis
  app.use('/actors', route);

  route.get('/validators', middlewares.validatorsDashboard);
  route.get('/waiting', middlewares.waitingDashboard);
  route.get('/nominators', middlewares.nominatorsDashboard);
};
