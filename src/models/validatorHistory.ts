import mongoose from 'mongoose';
const ValidatorHistory = new mongoose.Schema(
  {
    stashId: String,
    eraIndex: Number,
    commission: Number,
    eraPoints: Number,
    totalEraPoints: Number,
    slashCount: Number,
    totalStake: Number,
    nominatorsInfo: [
      {
        nomId: String,
        nomStake: Number,
      },
    ],
  },
  { timestamps: true },
);
export default ValidatorHistory;
