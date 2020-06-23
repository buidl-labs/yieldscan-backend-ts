import mongoose from 'mongoose';
import { IStakingInfo } from '../interfaces/IStakingInfo';
const SessionValidators = new mongoose.Schema(
  {
    riskScore: Number,
    estimatedPoolReward: Number,
    activeErasCount: Number,
    totalSlashCount: Number,
    stashId: String,
    controllerId: String,
    accountId: String,
    commission: Number,
    totalStake: Number,
    ownStake: Number,
    rewardsPer100KSM: Number,
    nominators: [
      {
        nomId: String,
        stake: Number,
      },
    ],
  },
  { timestamps: true },
);
export default mongoose.model<IStakingInfo & mongoose.Document>('sessionValidators', SessionValidators);
