import { University, UNIVERSITIES } from "@/data/universities";

export interface FullApplicantProfile {
  // Step 1: Academics
  gpa: number;
  gpaScale: number; // 4.0, 5.0, 100
  sat: number;
  ielts: number;
  gradeTrend: 'improving' | 'stable' | 'declining';
  ibApCourses: 'none' | '1-2' | '3-5' | '6+';

  // Step 2: Research & Olympiads
  research: 'none' | 'lab' | 'project' | 'submitted' | 'published';
  olympiad: 'none' | 'regional' | 'national_other' | 'national_gold' | 'international';
  competitionMedals: string[];

  // Step 3: Activities & Background
  ec: 'none' | 'member' | 'leadership' | 'founded_small' | 'founded_large';
  firstGen: boolean;
  financialHardship: boolean;
  languages3plus: boolean;
  uniqueStory: boolean;
  
  region: 'usa_canada' | 'uk_europe' | 'asia_global';
}

export interface DetailedAdmissionResult {
  schoolName: string;
  region: string;
  low: number;
  high: number;
  pros: string[];
  cons: string[];
  recommendations: string[];
}

function normalizeGPA(gpa: number, scale: number): number {
  if (scale === 4.0) return gpa;
  if (scale === 5.0) return (gpa / 5) * 4;
  if (scale === 100) return (gpa / 100) * 4;
  return gpa;
}

export function calculateChances(profile: FullApplicantProfile, university: University): DetailedAdmissionResult {
  let chance = university.baseRateInternational;
  const pros: string[] = [];
  const cons: string[] = [];
  const recommendations: string[] = [];

  // SAT Scoring
  if (profile.sat >= 1550) {
    chance += 0.08;
    pros.push("Elite SAT score 1550+ (+8%)");
  } else if (profile.sat >= 1500) {
    chance += 0.04;
    pros.push("Strong SAT score 1500+ (+4%)");
  } else if (profile.sat >= 1450) {
    // Neutral
  } else if (profile.sat >= 1400) {
    chance -= 0.05;
    cons.push("SAT score below 1450 (-5%)");
    recommendations.push("Retake SAT to reach 1500+ (+5-9%)");
  } else if (profile.sat > 0) {
    chance -= 0.10;
    cons.push("SAT score significantly below target (-10%)");
    recommendations.push("Intensive SAT prep required for 1500+");
  }

  // GPA Scoring
  const normGPA = normalizeGPA(profile.gpa, profile.gpaScale);
  if (normGPA >= 3.9) {
    chance += 0.05;
    pros.push("Elite academic performance GPA 3.9+ (+5%)");
  } else if (normGPA >= 3.7) {
    chance += 0.02;
    pros.push("Strong GPA 3.7+ (+2%)");
  } else if (normGPA < 3.5 && normGPA > 0) {
    chance -= 0.05;
    cons.push("GPA below 3.5 competitive threshold (-5%)");
  }

  // Research Scoring
  if (profile.research === 'published') {
    chance += 0.12;
    pros.push("Published research paper (+12%)");
  } else if (profile.research === 'submitted') {
    chance += 0.07;
    pros.push("Research paper submitted for review (+7%)");
    recommendations.push("Finalize and publish your research paper (+5%)");
  } else if (profile.research === 'project') {
    chance += 0.03;
    pros.push("Independent research project (+3%)");
  } else if (profile.research === 'lab') {
    chance += 0.02;
    pros.push("Lab/Research experience (+2%)");
  }

  // Olympiad Scoring
  if (profile.olympiad === 'international') {
    chance += 0.15;
    pros.push("International Olympiad medalist (+15%)");
  } else if (profile.olympiad === 'national_gold') {
    chance += 0.08;
    pros.push("National Olympiad Gold (+8%)");
  } else if (profile.olympiad === 'national_other') {
    chance += 0.04;
    pros.push("National Olympiad medalist (+4%)");
  } else if (profile.olympiad === 'regional') {
    chance += 0.01;
    pros.push("Regional competition recognition (+1%)");
  }

  // Extracurriculars
  if (profile.ec === 'founded_large') {
    chance += 0.08;
    pros.push("Founded major organization/platform (+8%)");
  } else if (profile.ec === 'founded_small') {
    chance += 0.04;
    pros.push("Founded local organization/initiative (+4%)");
  } else if (profile.ec === 'leadership') {
    chance += 0.03;
    pros.push("Significant leadership role (+3%)");
  }

  // Background
  if (profile.firstGen) {
    chance += 0.02;
    pros.push("First-generation college student (+2%)");
  }
  if (profile.financialHardship) {
    chance += 0.02;
    pros.push("Significant financial hardship (+2%)");
  }
  if (profile.languages3plus) {
    chance += 0.01;
    pros.push("Polyglot (3+ languages) (+1%)");
  }

  // Grade Trend
  if (profile.gradeTrend === 'improving') {
    chance += 0.03;
    pros.push("Positive grade trajectory (+3%)");
  } else if (profile.gradeTrend === 'declining') {
    chance -= 0.07;
    cons.push("Negative grade trajectory (-7%)");
  }

  // Curriculum Rigor
  if (profile.ibApCourses === '6+') chance += 0.04;
  else if (profile.ibApCourses === '3-5') chance += 0.02;

  // HARD CAPS based on University Rank
  if (university.rank <= 5) chance = Math.min(chance, 0.40);
  else if (university.rank <= 20) chance = Math.min(chance, 0.50);
  else if (university.rank <= 50) chance = Math.min(chance, 0.65);

  chance = Math.max(chance, 0.01); // Minimum 1%

  return {
    schoolName: university.name,
    region: university.region,
    low: Math.round(Math.max(0, chance - 0.04) * 100),
    high: Math.round(Math.min(1, chance + 0.04) * 100),
    pros,
    cons,
    recommendations
  };
}

/**
 * Backward compatibility helpers
 */
export type ApplicantProfile = FullApplicantProfile;
export type AdmissionResult = {
  schoolName: string;
  region: string;
  estimatedChance: number;
  pros: string[];
  cons: string[];
  recommendations: string[];
};

export function calculateAdmissionChance(profile: any, schoolName: string): AdmissionResult | undefined {
  const university = UNIVERSITIES.find(u => u.name === schoolName);
  if (!university) return undefined;
  
  const res = calculateChances(profile, university);
  return {
    schoolName: res.schoolName,
    region: res.region,
    estimatedChance: Math.round((res.low + res.high) / 2),
    pros: res.pros,
    cons: res.cons,
    recommendations: res.recommendations
  };
}

export { UNIVERSITIES } from "@/data/universities";
