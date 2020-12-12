export interface ITransactionData {
  stashId: string;
  network: string;
  alreadyBonded: number;
  stake: number;
  transactionHash: string;
  successful: boolean;
}
