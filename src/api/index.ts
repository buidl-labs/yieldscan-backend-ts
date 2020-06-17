import { Router } from 'express';
import reward from './routes/reward';

// guaranteed to get dependencies
export default () => {
  const app = Router();

  /**
   * Register any routing-middleware here by giving it access to the express-app
   */
  reward(app);

  return app;
};
