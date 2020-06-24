import mongoose from 'mongoose';
import { INominatorHistory } from '../interfaces/INominatorHistory';
const NominatorHistory = new mongoose.Schema(
  {
    eraIndex: Number,
    nomId: String,
    validatorsInfo: [
      {
        stashId: String,
        commission: Number,
        nomStake: Number,
        eraPoints: Number,
        totalEraPoints: Number,
        totalStake: Number,
      },
    ],
  },
  { timestamps: true },
);
export default mongoose.model<INominatorHistory & mongoose.Document>('nominatorHistory', NominatorHistory);
