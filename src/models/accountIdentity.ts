import mongoose from 'mongoose';
import { IAccountIdentity } from '../interfaces/IAccountIdentity';
const AccountIdentity = new mongoose.Schema(
  {
    accountId: String,
    stashId: String,
    display: String,
    email: String,
    legal: String,
    riot: String,
    web: String,
  },
  { timestamps: true },
);
export default mongoose.model<IAccountIdentity & mongoose.Document>('accountIdentity', AccountIdentity);
