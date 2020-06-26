import mongoose from 'mongoose';
import { IActiveNominators } from '../interfaces/IActiveNominators';
const ActiveNominators = new mongoose.Schema(
  {
    nomId: String,
    dailyEarnings: Number,
    validatorsInfo: [
      {
        stashId: String,
        commission: Number,
        nomStake: Number,
        totalStake: Number,
        riskScore: Number,
        claimedRewards: [Number],
        estimatedReward: Number,
      },
    ],
  },
  { timestamps: true },
);
export default mongoose.model<IActiveNominators & mongoose.Document>('activeNominators', ActiveNominators);
