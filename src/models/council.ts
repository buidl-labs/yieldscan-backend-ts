import mongoose from 'mongoose';
import { ICouncil } from '../interfaces/ICouncil';
const Council = new mongoose.Schema(
  {
    accountId: String,
    stake: Number,
    isPrime: Boolean,
    totalBalance: Number,
    backersInfo: [
      {
        backer: String,
        stake: Number,
      },
    ],
  },
  { timestamps: true },
);
export default mongoose.model<ICouncil & mongoose.Document>('council', Council);
