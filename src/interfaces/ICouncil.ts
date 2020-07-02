export interface ICouncil {
  member: string;
  stake: number;
  isPrime: boolean;
  backersInfo: [
    {
      backer: string;
      stake: number;
    },
  ];
}
