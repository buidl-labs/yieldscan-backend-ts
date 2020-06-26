export interface IActiveNominators {
  nomId: string;
  dailyEarnings: number;
  validatorsInfo: [
    {
      stashId: string;
      nomStake: number;
      commission: number;
      totalStake: number;
      riskScore: number;
      claimedRewards: [number];
      estimatedReward: number;
    },
  ];
}
