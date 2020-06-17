import { IStakingInfo } from '../interfaces/IStakingInfo';

export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
export function scaleData(val: number, max: number, min: number): number {
  return ((val - min) / (max - min)) * (100 - 1) + 1;
}
export function normalizeData(val: number, max: number, min: number): number {
  return (val - min) / (max - min);
}
export function sortLowRisk(arr: Array<IStakingInfo>): Array<IStakingInfo>{
  const lowestRiskset = arr.filter((x) => x.riskScore < 0.3);
  // console.log(lowestRiskset)
  const medRiskSet = arr.filter((x) => x.riskScore >= 0.3 && x.riskScore < 0.5);
  // console.log(medRiskSet)
  const lowMedSet = lowestRiskset.concat(medRiskSet);
  const remaining = arr.filter((n) => !lowMedSet.includes(n));
  const result = lowMedSet.concat(remaining);
  return result;
}

export function sortMedRisk(arr: Array<IStakingInfo>): Array<IStakingInfo> {
  const medRiskSet = arr.filter((x) => x.riskScore < 0.5);
  // console.log(medRiskSet)
  const remaining = arr.filter((n) => !medRiskSet.includes(n));
  const result = medRiskSet.concat(remaining);
  return result;
}