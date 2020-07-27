export interface ICouncil {
  accountId: string;
  stake: number;
  isRunnersUp: boolean;
  isPrime: boolean;
  totalBalance: number;
  backersInfo: [
    {
      backer: string;
      stake: number;
    },
  ];
}
