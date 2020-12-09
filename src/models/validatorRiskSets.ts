import mongoose from 'mongoose';
const ValidatorRiskSets = new mongoose.Schema(
  {
    lowriskset: [
      {
        stashId: String,
        commission: Number,
        totalStake: Number,
        estimatedPoolReward: Number,
        numOfNominators: Number,
        rewardsPer100KSM: Number,
        riskScore: Number,
        oversubscribed: Boolean,
        name: String,
        ownStake: Number,
        othersStake: Number,
      },
    ],
    medriskset: [
      {
        stashId: String,
        commission: Number,
        totalStake: Number,
        estimatedPoolReward: Number,
        numOfNominators: Number,
        rewardsPer100KSM: Number,
        riskScore: Number,
        oversubscribed: Boolean,
        name: String,
        ownStake: Number,
        othersStake: Number,
      },
    ],
    highriskset: [
      {
        stashId: String,
        commission: Number,
        totalStake: Number,
        estimatedPoolReward: Number,
        numOfNominators: Number,
        rewardsPer100KSM: Number,
        riskScore: Number,
        oversubscribed: Boolean,
        name: String,
        ownStake: Number,
        othersStake: Number,
      },
    ],
  },
  { timestamps: true },
);

export default ValidatorRiskSets;
