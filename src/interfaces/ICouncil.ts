export interface ICouncil {
  member: string;
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
