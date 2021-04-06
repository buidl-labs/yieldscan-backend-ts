import { Router } from 'express';

import middlewares from '../middlewares';
const route = Router();

export default (app: Router): void => {
  // Register our endpoint for this route-apis
  app.use('/:network/transactions', route);

  route.get('/', middlewares.transactionsData);
  route.get('/stats', middlewares.transactionStats);
};
