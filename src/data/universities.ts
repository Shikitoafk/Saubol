/**
 * Global University Database
 * Includes base rates, global ranks, and region tags for admissions logic.
 */

export interface University {
  name: string;
  region: 'usa_canada' | 'uk_europe' | 'asia_global';
  baseRateInternational: number;
  rank: number;
  medianSAT?: number;
}

export const UNIVERSITIES: University[] = [
  // USA & CANADA
  { name: "Harvard University", region: "usa_canada", baseRateInternational: 0.03, rank: 1, medianSAT: 1540 },
  { name: "MIT", region: "usa_canada", baseRateInternational: 0.04, rank: 2, medianSAT: 1550 },
  { name: "Stanford University", region: "usa_canada", baseRateInternational: 0.04, rank: 3, medianSAT: 1530 },
  { name: "Princeton University", region: "usa_canada", baseRateInternational: 0.04, rank: 4, medianSAT: 1540 },
  { name: "Yale University", region: "usa_canada", baseRateInternational: 0.05, rank: 5, medianSAT: 1530 },
  { name: "Columbia University", region: "usa_canada", baseRateInternational: 0.06, rank: 6, medianSAT: 1520 },
  { name: "UPenn", region: "usa_canada", baseRateInternational: 0.07, rank: 7, medianSAT: 1520 },
  { name: "Cornell University", region: "usa_canada", baseRateInternational: 0.08, rank: 8, medianSAT: 1510 },
  { name: "Dartmouth College", region: "usa_canada", baseRateInternational: 0.09, rank: 13, medianSAT: 1500 },
  { name: "Brown University", region: "usa_canada", baseRateInternational: 0.07, rank: 14, medianSAT: 1510 },
  { name: "Duke University", region: "usa_canada", baseRateInternational: 0.06, rank: 10, medianSAT: 1520 },
  { name: "Northwestern University", region: "usa_canada", baseRateInternational: 0.07, rank: 9, medianSAT: 1510 },
  { name: "Johns Hopkins", region: "usa_canada", baseRateInternational: 0.08, rank: 11, medianSAT: 1520 },
  { name: "Georgetown", region: "usa_canada", baseRateInternational: 0.12, rank: 22, medianSAT: 1480 },
  { name: "Carnegie Mellon", region: "usa_canada", baseRateInternational: 0.11, rank: 25, medianSAT: 1500 },
  { name: "UCLA", region: "usa_canada", baseRateInternational: 0.09, rank: 15, medianSAT: 1480 },
  { name: "University of Michigan", region: "usa_canada", baseRateInternational: 0.18, rank: 23, medianSAT: 1460 },
  { name: "University of Toronto", region: "usa_canada", baseRateInternational: 0.40, rank: 21, medianSAT: 1450 },
  { name: "McGill University", region: "usa_canada", baseRateInternational: 0.35, rank: 30, medianSAT: 1440 },
  { name: "UBC", region: "usa_canada", baseRateInternational: 0.38, rank: 35, medianSAT: 1420 },

  // UK & EUROPE
  { name: "University of Oxford", region: "uk_europe", baseRateInternational: 0.15, rank: 1, medianSAT: 1520 },
  { name: "University of Cambridge", region: "uk_europe", baseRateInternational: 0.16, rank: 2, medianSAT: 1510 },
  { name: "Imperial College London", region: "uk_europe", baseRateInternational: 0.18, rank: 3, medianSAT: 1500 },
  { name: "UCL", region: "uk_europe", baseRateInternational: 0.22, rank: 4, medianSAT: 1480 },
  { name: "University of Edinburgh", region: "uk_europe", baseRateInternational: 0.30, rank: 15, medianSAT: 1450 },
  { name: "University of Manchester", region: "uk_europe", baseRateInternational: 0.35, rank: 25, medianSAT: 1440 },
  { name: "King's College London", region: "uk_europe", baseRateInternational: 0.32, rank: 35, medianSAT: 1440 },
  { name: "LSE", region: "uk_europe", baseRateInternational: 0.09, rank: 45, medianSAT: 1500 },
  { name: "University of Glasgow", region: "uk_europe", baseRateInternational: 0.40, rank: 60, medianSAT: 1420 },
  { name: "University of Warwick", region: "uk_europe", baseRateInternational: 0.40, rank: 64, medianSAT: 1420 },
  { name: "ETH Zurich", region: "uk_europe", baseRateInternational: 0.15, rank: 10, medianSAT: 1500 },
  { name: "TU Delft", region: "uk_europe", baseRateInternational: 0.25, rank: 50, medianSAT: 1460 },
  { name: "KU Leuven", region: "uk_europe", baseRateInternational: 0.30, rank: 42, medianSAT: 1460 },

  // ASIA & GLOBAL
  { name: "NUS", region: "asia_global", baseRateInternational: 0.07, rank: 8, medianSAT: 1530 },
  { name: "NTU", region: "asia_global", baseRateInternational: 0.09, rank: 12, medianSAT: 1510 },
  { name: "KAIST", region: "asia_global", baseRateInternational: 0.15, rank: 40, medianSAT: 1480 },
  { name: "POSTECH", region: "asia_global", baseRateInternational: 0.20, rank: 70, medianSAT: 1460 },
  { name: "GIST", region: "asia_global", baseRateInternational: 0.25, rank: 100, medianSAT: 1440 },
  { name: "HKUST", region: "asia_global", baseRateInternational: 0.12, rank: 34, medianSAT: 1480 },
  { name: "HKU", region: "asia_global", baseRateInternational: 0.10, rank: 26, medianSAT: 1500 },
  { name: "CUHK", region: "asia_global", baseRateInternational: 0.15, rank: 45, medianSAT: 1480 },
  { name: "Peking University", region: "asia_global", baseRateInternational: 0.02, rank: 17, medianSAT: 1550 },
  { name: "Tsinghua University", region: "asia_global", baseRateInternational: 0.02, rank: 16, medianSAT: 1550 },
  { name: "University of Tokyo", region: "asia_global", baseRateInternational: 0.10, rank: 23, medianSAT: 1500 },
  { name: "Kyoto University", region: "asia_global", baseRateInternational: 0.12, rank: 33, medianSAT: 1480 }
];
