import mongoose from 'mongoose';
// import { IValidatorHistory } from '../interfaces/IValidatorHistory';
const ValidatorHistory = new mongoose.Schema(
  {
    stashId: String,
    poolReward: Number,
    validatorReward: Number,
    eraIndex: Number,
    commission: Number,
    eraPoints: Number,
    totalEraPoints: Number,
    totalReward: Number,
    slashCount: Number,
    nominatorsRewards: [
      {
        nomId: String,
        nomReward: Number,
        nomStake: Number,
      },
    ],
  },
  { timestamps: true },
);
// export default mongoose.model<IValidatorHistory & mongoose.Document>('ValidatorHistory', ValidatorHistory);
export default mongoose.model('validatorHistory', ValidatorHistory);
