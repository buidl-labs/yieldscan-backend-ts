export interface IValidatorHistory {
    stashId: string;
    poolReward: number;
    validatorReward: number;
    eraIndex: number;
    commission: number;
    eraPoints: number;
    totalEraPoints: number;
    totalReward: number;
    nominatorsRewards: [
      {
        nomId: string;
        nomReward: number;
        nomStake: number;
      }
    ]
}