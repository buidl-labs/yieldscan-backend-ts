import { IValidatorIdentity } from '../interfaces/IValidatorIdentity';
import mongoose from 'mongoose';

const ValidatorIdentity = new mongoose.Schema(
  {
    stashId: String,
    accountId: String,
    vision: String,
    members: [{ member: String, role: String, twitter: String }],
  },
  { timestamps: true },
);

export default mongoose.model<IValidatorIdentity & mongoose.Document>('ValidatorIdentity', ValidatorIdentity);
