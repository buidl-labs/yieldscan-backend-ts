import { Router, Request, Response } from 'express';
const route = Router();

export default (app: Router) => {
  // Register our endpoint for this route-apis
  app.use('/validator', route);

  route.get('/', (req: Request, res: Response) => {
    return res.json({ validators: [] }).status(200);
  });
};
