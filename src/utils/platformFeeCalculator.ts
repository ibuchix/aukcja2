
/**
 * Platform Fee Structure (PLN) based on winning bid ranges
 */
export const calculatePlatformFee = (winningBidAmount: number): number => {
  if (winningBidAmount <= 4999) return 600;
  if (winningBidAmount <= 9999) return 700;
  if (winningBidAmount <= 19999) return 800;
  if (winningBidAmount <= 29999) return 900;
  if (winningBidAmount <= 39999) return 1000;
  if (winningBidAmount <= 49999) return 1100;
  if (winningBidAmount <= 59999) return 1200;
  if (winningBidAmount <= 69999) return 1300;
  if (winningBidAmount <= 79999) return 1400;
  if (winningBidAmount <= 89999) return 1500;
  if (winningBidAmount <= 99999) return 1600;
  if (winningBidAmount <= 124999) return 1700;
  if (winningBidAmount <= 149999) return 1800;
  if (winningBidAmount <= 174999) return 1900;
  if (winningBidAmount <= 199999) return 2050;
  if (winningBidAmount <= 224999) return 2150;
  if (winningBidAmount <= 249999) return 2250;
  if (winningBidAmount <= 299999) return 2550;
  if (winningBidAmount <= 349999) return 2650;
  if (winningBidAmount <= 399999) return 2750;
  if (winningBidAmount <= 499999) return 2850;
  return 3150; // 500,000+ PLN
};

/**
 * Get the fee tier description for display purposes
 */
export const getPlatformFeeTier = (winningBidAmount: number): string => {
  if (winningBidAmount <= 4999) return "0 - 4,999 PLN";
  if (winningBidAmount <= 9999) return "5,000 - 9,999 PLN";
  if (winningBidAmount <= 19999) return "10,000 - 19,999 PLN";
  if (winningBidAmount <= 29999) return "20,000 - 29,999 PLN";
  if (winningBidAmount <= 39999) return "30,000 - 39,999 PLN";
  if (winningBidAmount <= 49999) return "40,000 - 49,999 PLN";
  if (winningBidAmount <= 59999) return "50,000 - 59,999 PLN";
  if (winningBidAmount <= 69999) return "60,000 - 69,999 PLN";
  if (winningBidAmount <= 79999) return "70,000 - 79,999 PLN";
  if (winningBidAmount <= 89999) return "80,000 - 89,999 PLN";
  if (winningBidAmount <= 99999) return "90,000 - 99,999 PLN";
  if (winningBidAmount <= 124999) return "100,000 - 124,999 PLN";
  if (winningBidAmount <= 149999) return "125,000 - 149,999 PLN";
  if (winningBidAmount <= 174999) return "150,000 - 174,999 PLN";
  if (winningBidAmount <= 199999) return "175,000 - 199,999 PLN";
  if (winningBidAmount <= 224999) return "200,000 - 224,999 PLN";
  if (winningBidAmount <= 249999) return "225,000 - 249,999 PLN";
  if (winningBidAmount <= 299999) return "250,000 - 299,999 PLN";
  if (winningBidAmount <= 349999) return "300,000 - 349,999 PLN";
  if (winningBidAmount <= 399999) return "350,000 - 399,999 PLN";
  if (winningBidAmount <= 499999) return "400,000 - 499,999 PLN";
  return "500,000+ PLN";
};

export type PlatformFeeTier = { min: number; max: number | null; fee: number; label: string };

export const PLATFORM_FEE_TIERS: PlatformFeeTier[] = [
  { min: 0, max: 4999, fee: 600, label: "0 - 4,999 PLN" },
  { min: 5000, max: 9999, fee: 700, label: "5,000 - 9,999 PLN" },
  { min: 10000, max: 19999, fee: 800, label: "10,000 - 19,999 PLN" },
  { min: 20000, max: 29999, fee: 900, label: "20,000 - 29,999 PLN" },
  { min: 30000, max: 39999, fee: 1000, label: "30,000 - 39,999 PLN" },
  { min: 40000, max: 49999, fee: 1100, label: "40,000 - 49,999 PLN" },
  { min: 50000, max: 59999, fee: 1200, label: "50,000 - 59,999 PLN" },
  { min: 60000, max: 69999, fee: 1300, label: "60,000 - 69,999 PLN" },
  { min: 70000, max: 79999, fee: 1400, label: "70,000 - 79,999 PLN" },
  { min: 80000, max: 89999, fee: 1500, label: "80,000 - 89,999 PLN" },
  { min: 90000, max: 99999, fee: 1600, label: "90,000 - 99,999 PLN" },
  { min: 100000, max: 124999, fee: 1700, label: "100,000 - 124,999 PLN" },
  { min: 125000, max: 149999, fee: 1800, label: "125,000 - 149,999 PLN" },
  { min: 150000, max: 174999, fee: 1900, label: "150,000 - 174,999 PLN" },
  { min: 175000, max: 199999, fee: 2050, label: "175,000 - 199,999 PLN" },
  { min: 200000, max: 224999, fee: 2150, label: "200,000 - 224,999 PLN" },
  { min: 225000, max: 249999, fee: 2250, label: "225,000 - 249,999 PLN" },
  { min: 250000, max: 299999, fee: 2550, label: "250,000 - 299,999 PLN" },
  { min: 300000, max: 349999, fee: 2650, label: "300,000 - 349,999 PLN" },
  { min: 350000, max: 399999, fee: 2750, label: "350,000 - 399,999 PLN" },
  { min: 400000, max: 499999, fee: 2850, label: "400,000 - 499,999 PLN" },
  { min: 500000, max: null, fee: 3150, label: "500,000+ PLN" },
];
