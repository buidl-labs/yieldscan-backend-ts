import { IYieldScanIdentity } from '../interfaces/IYieldScanIdentity';
import mongoose from 'mongoose';

const YieldScanIdentity = new mongoose.Schema(
  {
    stashId: String,
    vision: String,
    members: [{ member: String, role: String, twitter: String }],
  },
  { timestamps: true },
);

export default mongoose.model<IYieldScanIdentity & mongoose.Document>('YieldScanIdentity', YieldScanIdentity);
