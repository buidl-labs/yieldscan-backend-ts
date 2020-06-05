import { Document, Model } from 'mongoose';
import { IValidator } from '../../interfaces/IValidator';
declare global {
  namespace Express {
    export interface Request {
      currentUser: IValidator & Document;
    }
  }

  namespace Models {
    export type UserModel = Model<IValidator & Document>;
  }
}
