import { Router } from 'express';
import middlewares from '../middlewares';
const route = Router();

export default (app: Router): void => {
  // Register our endpoint for this route-apis
  app.use('/kusama/user', route);
  app.use('/polkadot/user', route);

  route.get('/:id', middlewares.userData);
};
