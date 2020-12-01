import { Router } from 'express';
import middlewares from '../middlewares';
const route = Router();

export default (app: Router): void => {
  // Register our endpoint for this route-apis
  app.use('/', route);

  route.get('/edgeware/validators', middlewares.validatorsDashboard);
  route.get('/edgeware/waiting', middlewares.waitingDashboard);
  route.get('/edgeware/nominators', middlewares.nominatorsDashboard);
};
