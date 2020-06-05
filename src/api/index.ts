import { Router } from 'express';
import validator from './routes/validator';

// guaranteed to get dependencies
export default () => {
  const app = Router();

  /**
   * Register any routing-middleware here by giving it access to the express-app
   */
  validator(app);

  return app;
};
