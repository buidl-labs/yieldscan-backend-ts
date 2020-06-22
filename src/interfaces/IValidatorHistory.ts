export interface IValidatorHistory {
  stashId: string;
  eraIndex: number;
  commission: number;
  eraPoints: number;
  totalEraPoints: number;
  nominatorsInfo: [
    {
      nomId: string;
      nomStake: number;
    },
  ];
}
