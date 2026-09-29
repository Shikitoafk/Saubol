// Link to the publishers' original materials rather than copying their tasks into Saubol.
const britishCouncilWritingPdf = "https://takeielts.britishcouncil.org/sites/default/files/%5Bdownloads%5D/ielts-academic-writing-sample-tasks-2023.pdf";
const ieltsSpeakingPdf = "https://ielts.org/cdn/ielts-downloadable-assets/ielts-sample-tests/ielts-speaking-sample-tasks-2023.pdf";

export const officialWritingSamples = [
  { id: "official-writing-1a", task: 1, title: "Further education chart", description: "Academic Task 1A · chart · PDF page 3", url: `${britishCouncilWritingPdf}#page=3`, source: "British Council / IELTS", minimumWords: 150, suggestedMinutes: 20 },
  { id: "official-writing-1b", task: 1, title: "Radio and television graph", description: "Academic Task 1B · graph · PDF page 4", url: `${britishCouncilWritingPdf}#page=4`, source: "British Council / IELTS", minimumWords: 150, suggestedMinutes: 20 },
  { id: "official-writing-1c", task: 1, title: "Brick production diagram", description: "Academic Task 1C · process diagram · PDF page 5", url: `${britishCouncilWritingPdf}#page=5`, source: "British Council / IELTS", minimumWords: 150, suggestedMinutes: 20 },
  { id: "official-writing-2a", task: 2, title: "Money and growing up", description: "Academic Task 2A · opinion essay · PDF page 6", url: `${britishCouncilWritingPdf}#page=6`, source: "British Council / IELTS", minimumWords: 250, suggestedMinutes: 40 },
  { id: "official-writing-2b", task: 2, title: "International tourism", description: "Academic Task 2B · advantages/disadvantages essay · PDF page 7", url: `${britishCouncilWritingPdf}#page=7`, source: "British Council / IELTS", minimumWords: 250, suggestedMinutes: 40 },
] as const;

export const officialSpeakingSamples = [
  { id: "official-speaking-1", title: "Part 1 · Hometown and accommodation", description: "Interview questions and a sample transcript · PDF page 3", url: `${ieltsSpeakingPdf}#page=3`, source: "IELTS.org" },
  { id: "official-speaking-2", title: "Part 2 · Important possession", description: "Cue card and sample transcript · PDF page 5", url: `${ieltsSpeakingPdf}#page=5`, source: "IELTS.org" },
  { id: "official-speaking-3", title: "Part 3 · Values and advertising", description: "Discussion questions and a sample transcript · PDF page 6", url: `${ieltsSpeakingPdf}#page=6`, source: "IELTS.org" },
] as const;

export const officialPracticeCollections = {
  writing: [
    { title: "British Council Writing samples", url: "https://takeielts.britishcouncil.org/prepare/ielts-free-practice-mock-tests/academic/writing" },
    { title: "IDP Writing practice library", url: "https://ielts.idp.com/prepare/all-test-types/writing" },
  ],
  speaking: [
    { title: "British Council Speaking samples", url: "https://takeielts.britishcouncil.org/prepare/ielts-free-practice-mock-tests/academic/speaking" },
    { title: "IDP Speaking practice library", url: "https://ielts.idp.com/prepare/all-test-types/speaking" },
  ],
} as const;
