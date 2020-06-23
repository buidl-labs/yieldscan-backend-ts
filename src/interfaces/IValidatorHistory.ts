export interface IValidatorHistory {
  stashId: string;
  eraIndex: number;
  commission: number;
  eraPoints: number;
  slashCount: number;
  totalEraPoints: number;
  nominatorsInfo: [
    {
      nomId: string;
      nomStake: number;
    },
  ];
}
