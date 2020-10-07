import mongoose from 'mongoose';
const Council = new mongoose.Schema(
  {
    accountId: String,
    stake: Number,
    isRunnersUp: Boolean,
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
export default Council;
