import mongoose from 'mongoose';
const NominatorStats = new mongoose.Schema(
  {
    nomCount: Number,
    totalRewards: Number,
    totalAmountStaked: Number,
    nomMinStake: Number,
  },
  { timestamps: true },
);
export default NominatorStats;
