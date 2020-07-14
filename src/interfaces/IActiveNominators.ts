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
      isElected: boolean;
      isNextElected: boolean;
      isWaiting: boolean;
      claimedRewards: [number];
      estimatedReward: number;
      estimatedPoolReward: number;
    },
  ];
}
