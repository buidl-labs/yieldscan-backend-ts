import { Router, Request, Response } from 'express';
const route = Router();

export default (app: Router) => {
  // Register our endpoint for this route-apis
  app.use('/rewards', route);

  route.get('/max-set', (req: Request, res: Response) => {
    return res.json({ validators: [] }).status(200);
  });
  route.get('/risk-set', (req: Request, res: Response) => {
    return res.json({ validators: [] }).status(200);
  });
};
