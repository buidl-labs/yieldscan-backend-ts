import mongoose from 'mongoose';
const TransactionData = new mongoose.Schema(
  {
    stashId: String,
    network: String,
    alreadyBonded: Number,
    stake: Number,
    transactionHash: String,
    successful: Boolean,
  },
  { timestamps: true },
);
export default TransactionData;
