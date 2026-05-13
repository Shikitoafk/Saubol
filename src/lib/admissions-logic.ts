/**
 * Admissions Logic v4.0 - Global Intelligence Engine
 * Realistic admission probability modeling based on international applicant data.
 */

export interface ApplicantProfile {
  // Academics
  gpa: number;
  gpaScale: number; // 4.0, 5.0, 100
  classRank: 'top5' | 'top10' | 'top25' | 'unknown';
  sat?: number;
  ielts?: number;
  curriculum: 'IB' | 'AP' | 'ALevel' | 'National';
  curriculumCount: number; // # of IB/AP/A-Levels
  gradeTrend: 'Improving' | 'Stable' | 'Declining';

  // Research
  hasPublishedPaper: boolean;
  paperStatus: 'Published' | 'UnderReview' | 'None';
  labExperience: boolean;
  independentResearch: boolean;

  // Olympiads
  olympiadLevel: 'International' | 'NationalGold' | 'NationalSilverBronze' | 'None';
  competitionMedals: string[];

  // Extracurriculars
  foundedOrg: boolean;
  orgReach: number; // # of users/members
  leadershipRole: boolean;
  communityService: boolean;
  sportsCompetitive: boolean;
  artsCompetitive: boolean;

  // Personal
  country: string;
  isFirstGen: boolean;
  financialHardship: boolean;
  speaksThreeLanguages: boolean;

  // Search
  targetRegions: ('US' | 'UK' | 'Canada' | 'Asia' | 'Australia')[];
}

export interface AdmissionResult {
  schoolName: string;
  region: string;
  estimatedChance: number;
  pros: string[];
  cons: string[];
  recommendations: string[];
}

export const UNIVERSITIES = [
  // US
  { name: "Harvard University", region: "US", baseRate: 0.03, medianSAT: 1540 },
  { name: "MIT", region: "US", baseRate: 0.04, medianSAT: 1550 },
  { name: "Stanford University", region: "US", baseRate: 0.04, medianSAT: 1530 },
  { name: "Princeton University", region: "US", baseRate: 0.04, medianSAT: 1540 },
  { name: "Yale University", region: "US", baseRate: 0.05, medianSAT: 1530 },
  { name: "Columbia University", region: "US", baseRate: 0.06, medianSAT: 1520 },
  { name: "UPenn", region: "US", baseRate: 0.07, medianSAT: 1520 },
  { name: "Cornell University", region: "US", baseRate: 0.08, medianSAT: 1510 },
  { name: "UC Berkeley", region: "US", baseRate: 0.12, medianSAT: 1480 },
  { name: "NYU", region: "US", baseRate: 0.13, medianSAT: 1460 },

  // UK
  { name: "University of Oxford", region: "UK", baseRate: 0.15, medianSAT: 1520 },
  { name: "University of Cambridge", region: "UK", baseRate: 0.16, medianSAT: 1510 },
  { name: "Imperial College London", region: "UK", baseRate: 0.18, medianSAT: 1500 },
  { name: "UCL", region: "UK", baseRate: 0.22, medianSAT: 1480 },
  { name: "LSE", region: "UK", baseRate: 0.09, medianSAT: 1500 },

  // Canada
  { name: "University of Toronto", region: "Canada", baseRate: 0.40, medianSAT: 1450 },
  { name: "McGill University", region: "Canada", baseRate: 0.35, medianSAT: 1440 },
  { name: "UBC", region: "Canada", baseRate: 0.38, medianSAT: 1420 },

  // Asia
  { name: "NUS", region: "Asia", baseRate: 0.07, medianSAT: 1530 },
  { name: "NTU", region: "Asia", baseRate: 0.09, medianSAT: 1510 },
  { name: "KAIST", region: "Asia", baseRate: 0.15, medianSAT: 1480 },
  { name: "Tsinghua University", region: "Asia", baseRate: 0.02, medianSAT: 1550 },
  { name: "HKU", region: "Asia", baseRate: 0.12, medianSAT: 1480 }
];

export function calculateDetailedAdmissions(profile: ApplicantProfile): AdmissionResult[] {
  return UNIVERSITIES
    .filter(u => profile.targetRegions.includes(u.region as any))
    .map(school => {
      let chance = school.baseRate;
      const pros: string[] = [];
      const cons: string[] = [];
      const recommendations: string[] = [];

      // Academic Modifiers
      if (profile.sat && profile.sat > school.medianSAT) {
        chance += 0.05;
        pros.push(`SAT ${profile.sat} above median (+5%)`);
      } else if (profile.sat && profile.sat < school.medianSAT) {
        chance -= 0.08;
        cons.push(`SAT ${profile.sat} below median ${school.medianSAT} (-8%)`);
        recommendations.push(`Improve SAT to ${school.medianSAT + 20} (+5-8%)`);
      }

      if (profile.curriculumCount >= 3) {
        chance += 0.03;
        pros.push(`Rigorous curriculum (3+ AP/IB) (+3%)`);
      }

      if (profile.gradeTrend === 'Improving') {
        chance += 0.03;
        pros.push("Improving grade trend (+3%)");
      } else if (profile.gradeTrend === 'Declining') {
        chance -= 0.07;
        cons.push("Declining grade trend (-7%)");
      }

      // Research Modifiers
      if (profile.paperStatus === 'Published') {
        chance += 0.12;
        pros.push("Published research paper (+12%)");
      } else if (profile.paperStatus === 'UnderReview') {
        chance += 0.07;
        pros.push("Research paper under review (+7%)");
        recommendations.push("Successfully publish your paper (+5%)");
      } else if (profile.labExperience) {
        chance += 0.05;
        pros.push("Lab research experience (+5%)");
      } else {
        chance -= 0.03;
        cons.push("No research experience (-3%)");
      }

      // Olympiad Modifiers
      if (profile.olympiadLevel === 'International') {
        chance += 0.15;
        pros.push("International Olympiad medal (+15%)");
      } else if (profile.olympiadLevel === 'NationalGold') {
        chance += 0.08;
        pros.push("National Olympiad Gold (+8%)");
      } else if (profile.olympiadLevel === 'NationalSilverBronze') {
        chance += 0.04;
        pros.push("National Olympiad medal (+4%)");
      }

      // EC Modifiers
      if (profile.foundedOrg) {
        const reachMod = profile.orgReach >= 100 ? 0.08 : 0.03;
        chance += reachMod;
        pros.push(`Founded organization (${profile.orgReach}+ users) (+${Math.round(reachMod * 100)}%)`);
      }

      if (profile.leadershipRole) {
        chance += 0.03;
        pros.push("Significant leadership role (+3%)");
      }

      if (!profile.foundedOrg && !profile.leadershipRole && !profile.communityService) {
        chance -= 0.05;
        cons.push("Weak extracurricular profile (-5%)");
      }

      // Personal Modifiers
      if (profile.isFirstGen) chance += 0.02;
      if (profile.speaksThreeLanguages) chance += 0.01;

      // Hard Caps
      let finalChance = chance;
      const rank = UNIVERSITIES.indexOf(school) + 1; // Simplified rank
      if (rank <= 5) finalChance = Math.min(finalChance, 0.40);
      else if (rank <= 20) finalChance = Math.min(finalChance, 0.50);
      else finalChance = Math.min(finalChance, 0.65);

      return {
        schoolName: school.name,
        region: school.region,
        estimatedChance: Math.round(finalChance * 100),
        pros,
        cons,
        recommendations
      };
    });
}

/**
 * Helper for legacy components to calculate chance for one school
 */
export function calculateAdmissionChance(profile: ApplicantProfile, schoolName: string): AdmissionResult | undefined {
  const results = calculateDetailedAdmissions(profile);
  return results.find(r => r.schoolName === schoolName);
}
