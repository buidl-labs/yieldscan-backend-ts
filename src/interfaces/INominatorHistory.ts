export interface INominatorHistory {
  nomId: string;
  eraIndex: number;
  validatorsInfo: [
    {
      stashId: string;
      nomStake: number;
      commission: number;
      eraPoints: number;
      totalEraPoints: number;
      totalStake: number;
    },
  ];
}
