import { Router } from 'express';
import middlewares from '../middlewares';
const route = Router();

export default (app: Router) => {
  // Register our endpoint for this route-apis
  app.use('/council', route);

  route.get('/members', middlewares.councilMembers);
  route.get('/member/:id', middlewares.councilMember);
};
