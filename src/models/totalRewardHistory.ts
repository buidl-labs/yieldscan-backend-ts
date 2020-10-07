import mongoose from 'mongoose';
const TotalRewardHistory = new mongoose.Schema(
  {
    eraIndex: Number,
    eraTotalReward: Number,
  },
  { timestamps: true },
);
export default TotalRewardHistory;
