import mongoose from 'mongoose';
import { ICouncil } from '../interfaces/ICouncil';
const Council = new mongoose.Schema(
  {
    member: String,
    stake: Number,
    isPrime: Boolean,
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
