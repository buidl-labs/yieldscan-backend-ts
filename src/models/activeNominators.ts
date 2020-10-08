import mongoose from 'mongoose';
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
        isElected: Boolean,
        isNextElected: Boolean,
        isWaiting: Boolean,
        claimedRewards: [Number],
        estimatedReward: Number,
        estimatedPoolReward: Number,
      },
    ],
  },
  { timestamps: true },
);
export default ActiveNominators;
