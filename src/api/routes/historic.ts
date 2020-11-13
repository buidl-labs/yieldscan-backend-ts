import { Router } from 'express';
import middlewares from '../middlewares';
const route = Router();

export default (app: Router): void => {
  // Register our endpoint for this route-apis
  app.use('/kusama/historic/lowest-nominator-stake', route);
  app.use('/polkadot/historic/lowest-nominator-stake', route);

  route.get('/:era', middlewares.lowestNominatorStake);
};
