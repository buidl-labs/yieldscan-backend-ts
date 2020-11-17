import mongoose from 'mongoose';
const AccountIdentity = new mongoose.Schema(
  {
    accountId: String,
    stashId: String,
    display: String,
    email: String,
    eraIndex: Number,
    legal: String,
    riot: String,
    web: String,
    twitter: String,
  },
  { timestamps: true },
);
export default AccountIdentity;
