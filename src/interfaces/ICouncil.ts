export interface ICouncil {
  accountId: string;
  stake: number;
  isPrime: boolean;
  totalBalance: number;
  backersInfo: [
    {
      backer: string;
      stake: number;
    },
  ];
}
