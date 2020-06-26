export interface IStakingInfo {
  rewardsPer100KSM: number;
  riskScore: number;
  estimatedPoolReward: number;
  activeErasCount: number;
  totalSlashCount: number;
  stashId: string;
  controllerId: string;
  accountId: string;
  commission: number;
  totalStake: number;
  ownStake: number;
  nominators: [
    {
      nomId: string;
      stake: number;
    },
  ];
  claimedRewards: [number];
}
