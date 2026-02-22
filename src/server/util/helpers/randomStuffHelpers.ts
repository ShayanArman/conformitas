export function randomIntFromInterval(min: number, max: number) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function areTwoStringArraysTheSame(arr1: string[], arr2: string[]) {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
}

export function isNumber(value: any): boolean {
  // Try to convert the value to a number
  const num = Number(value);
  // Check if the result is a finite number
  return !isNaN(num) && isFinite(num);
}
