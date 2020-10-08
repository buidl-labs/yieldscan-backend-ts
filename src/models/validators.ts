import mongoose from 'mongoose';
const Validators = new mongoose.Schema(
  {
    stashId: String,
    controllerId: String,
    accountId: String,
    riskScore: Number,
    estimatedPoolReward: Number,
    activeErasCount: Number,
    totalSlashCount: Number,
    commission: Number,
    totalStake: Number,
    ownStake: Number,
    rewardsPer100KSM: Number,
    isElected: Boolean,
    isNextElected: Boolean,
    isWaiting: Boolean,
    nominators: [
      {
        nomId: String,
        stake: Number,
      },
    ],
    claimedRewards: [Number],
  },
  { timestamps: true },
);

export default Validators;
