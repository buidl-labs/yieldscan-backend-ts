import mongoose from 'mongoose';
import { ITotalRewardHistory } from '../interfaces/ITotalRewardHistory';
const TotalRewardHistory = new mongoose.Schema(
  {
    eraIndex: Number,
    eraTotalReward: Number,
  },
  { timestamps: true },
);
export default mongoose.model<ITotalRewardHistory & mongoose.Document>('totalRewardHistory', TotalRewardHistory);
