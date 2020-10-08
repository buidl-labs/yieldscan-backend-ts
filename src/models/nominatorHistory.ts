import mongoose from 'mongoose';
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
export default NominatorHistory;
