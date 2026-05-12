/**
 * Admissions Logic Engine v3.0
 * Realistic probability modeling for international applicants.
 */

export interface AdmissionsProfile {
  sat: number;
  gpa: number; // 0.0 - 5.0
  ielts: number;
  research: 'none' | 'lab' | 'preprint' | 'published';
  olympiad: 'none' | 'regional' | 'national_bronze_silver' | 'national_gold' | 'international';
  extracurriculars: 'participation' | 'leadership' | 'founder';
  region: string;
}

export interface SchoolBaseRate {
  name: string;
  rate: number; // Percentage 0-100
  rank: number;
}

export const SCHOOL_BASE_RATES: SchoolBaseRate[] = [
  { name: "Harvard University", rate: 3, rank: 1 },
  { name: "MIT", rate: 3, rank: 2 },
  { name: "Stanford University", rate: 3, rank: 3 },
  { name: "Princeton University", rate: 4, rank: 4 },
  { name: "Yale University", rate: 4, rank: 5 },
  { name: "Columbia University", rate: 5, rank: 6 },
  { name: "UPenn", rate: 6, rank: 7 },
  { name: "Cornell University", rate: 7, rank: 8 },
  { name: "Dartmouth College", rate: 7, rank: 9 },
  { name: "Brown University", rate: 6, rank: 10 },
  { name: "Duke University", rate: 7, rank: 11 },
  { name: "Northwestern University", rate: 8, rank: 12 },
  { name: "Johns Hopkins", rate: 7, rank: 13 },
  { name: "University of Toronto", rate: 20, rank: 20 },
  { name: "McGill University", rate: 22, rank: 25 },
  { name: "NUS", rate: 15, rank: 15 },
  { name: "NTU", rate: 18, rank: 20 },
  { name: "KAIST", rate: 20, rank: 30 },
  { name: "Imperial College London", rate: 25, rank: 10 },
  { name: "UCL", rate: 28, rank: 15 }
];

export function calculateAdmissionChance(profile: AdmissionsProfile, school: SchoolBaseRate) {
  let chance = school.rate;
  const explanations: string[] = [];
  explanations.push(`${school.name}: Base rate for international students ${school.rate}%.`);

  // SAT Modifiers
  if (profile.sat >= 1550) { chance += 8; explanations.push(`SAT ${profile.sat} is exceptional (+8%).`); }
  else if (profile.sat >= 1500) { chance += 4; explanations.push(`SAT ${profile.sat} is competitive (+4%).`); }
  else if (profile.sat >= 1450) { explanations.push(`SAT ${profile.sat} is at median (+0%).`); }
  else if (profile.sat >= 1400) { chance -= 5; explanations.push(`SAT ${profile.sat} is below median (-5%).`); }
  else { chance -= 10; explanations.push(`SAT ${profile.sat} is significantly below target (-10%).`); }

  // GPA Modifiers (scale 5.0)
  if (profile.gpa >= 4.8) { chance += 5; explanations.push(`GPA ${profile.gpa} is outstanding (+5%).`); }
  else if (profile.gpa >= 4.5) { chance += 2; explanations.push(`GPA ${profile.gpa} is strong (+2%).`); }
  else { chance -= 3; explanations.push(`GPA ${profile.gpa} is below target (-3%).`); }

  // IELTS Modifiers
  if (profile.ielts >= 8.0) { chance += 3; explanations.push(`IELTS ${profile.ielts} shows perfect proficiency (+3%).`); }
  else if (profile.ielts < 7.0) { chance -= 5; explanations.push(`IELTS ${profile.ielts} is below requirements (-5%).`); }

  // Research Modifiers
  if (profile.research === 'published') { chance += 12; explanations.push("Published research paper in peer-reviewed journal (+12%)."); }
  else if (profile.research === 'preprint') { chance += 7; explanations.push("Research preprint or submission (+7%)."); }
  else if (profile.research === 'lab') { chance += 3; explanations.push("Laboratory or assistant experience (+3%)."); }

  // Olympiad Modifiers
  if (profile.olympiad === 'international') { chance += 15; explanations.push("International Olympiad medal (+15%)."); }
  else if (profile.olympiad === 'national_gold') { chance += 8; explanations.push("National Gold medal (+8%)."); }
  else if (profile.olympiad === 'national_bronze_silver') { chance += 4; explanations.push("National Silver/Bronze medal (+4%)."); }
  else if (profile.olympiad === 'regional') { chance += 1; explanations.push("Regional competition success (+1%)."); }

  // Extracurriculars
  if (profile.extracurriculars === 'founder') { chance += 8; explanations.push("Founded organization with measurable impact (+8%)."); }
  else if (profile.extracurriculars === 'leadership') { chance += 4; explanations.push("Leadership roles in multiple activities (+4%)."); }
  else { chance += 1; explanations.push("Participation in extracurriculars (+1%)."); }

  // Region Bonus
  if (profile.region === 'Kazakhstan' && (school.name.includes('Toronto') || school.name.includes('McGill'))) {
    chance += 2; explanations.push("Applying to Canadian schools from Kazakhstan (+2%).");
  } else if (profile.region === 'Central Asia' && (school.name.includes('NUS') || school.name.includes('KAIST'))) {
    chance += 3; explanations.push("Central Asia regional recruitment bonus (+3%).");
  }

  // Hard Caps
  if (school.rank <= 30) chance = Math.min(chance, 45);
  chance = Math.min(chance, 65);
  chance = Math.max(chance, 1);

  // Range calculation
  const min = Math.max(1, Math.round(chance * 0.9));
  const max = Math.min(65, Math.round(chance * 1.1));

  // Improvement suggestions
  const improvements: string[] = [];
  if (profile.sat < 1550) improvements.push(`Retake SAT to reach 1550+ (+${8 - (profile.sat >= 1500 ? 4 : (profile.sat >= 1450 ? 0 : -5)) }%)`);
  if (profile.research !== 'published') improvements.push("Publish your research paper in a recognized journal (+5-12%)");
  if (profile.olympiad !== 'international' && profile.olympiad !== 'national_gold') improvements.push("Secure a national or international medal in your subject area (+4-15%)");

  return {
    range: `${min}-${max}%`,
    explanations,
    improvements,
    verdict: chance > 40 ? "Competitive Candidate" : chance > 20 ? "Target / Possible" : "Reach / Long Shot"
  };
}
