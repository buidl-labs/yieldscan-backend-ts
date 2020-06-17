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
