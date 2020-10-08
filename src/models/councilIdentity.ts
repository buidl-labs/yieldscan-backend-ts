import mongoose from 'mongoose';
const CouncilIdentity = new mongoose.Schema(
  {
    accountId: String,
    vision: String,
    members: [{ member: String, role: String, twitter: String }],
  },
  { timestamps: true },
);

export default CouncilIdentity;
