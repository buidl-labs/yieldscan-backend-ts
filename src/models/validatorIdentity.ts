import mongoose from 'mongoose';
const ValidatorIdentity = new mongoose.Schema(
  {
    stashId: String,
    accountId: String,
    vision: String,
    members: [{ member: String, role: String, twitter: String }],
  },
  { timestamps: true },
);

export default ValidatorIdentity;
