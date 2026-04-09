import { useState, useEffect } from "react";
import {
  BookOpen,
  Headphones,
  PenTool,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  HelpCircle,
  ClipboardList,
  GraduationCap,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type Skill = "reading" | "listening" | "writing" | "speaking";
type TestType = "predictions" | "cambridge";
type Difficulty = "Easy" | "Medium" | "Hard";

interface TestItem {
  id: string;
  name: string;
  topic: string;
  difficulty: Difficulty;
  questions: number;
  time: string;
  slug?: string;
}

const skills: { id: Skill; icon: typeof BookOpen; title: string; description: string }[] = [
  { id: "reading", icon: BookOpen, title: "Reading", description: "Learn skimming, scanning and detail techniques" },
  { id: "listening", icon: Headphones, title: "Listening", description: "Train your ear with section-by-section strategies" },
  { id: "writing", icon: PenTool, title: "Writing", description: "Master Task 1 & Task 2 with templates and examples" },
  { id: "speaking", icon: MessageCircle, title: "Speaking", description: "Prepare for all 3 parts with sample answers" },
];

const testTypes: { id: TestType; icon: typeof ClipboardList; title: string; description: string }[] = [
  { id: "predictions", icon: ClipboardList, title: "Prediction Tests", description: "Based on recent exam patterns" },
  { id: "cambridge", icon: GraduationCap, title: "Cambridge Tests", description: "Official Cambridge IELTS books 1–19" },
];

const listeningPredictionTests: TestItem[] = [
  { id: "L1",    name: "Full Listening Test 1",         topic: "Full Listening Practice", difficulty: "Hard", questions: 40, time: "40 min", slug: "full-listening-1" },
  { id: "L2",    name: "Full Listening Test 2",         topic: "Full Listening Practice", difficulty: "Hard", questions: 40, time: "40 min", slug: "full-listening-2" },
  { id: "L3",    name: "Full Listening Test 3",         topic: "Full Listening Practice", difficulty: "Hard", questions: 40, time: "40 min", slug: "full-listening-3" },
  { id: "L4",    name: "Full Listening Test 4",         topic: "Full Listening Practice", difficulty: "Hard", questions: 40, time: "40 min", slug: "full-listening-4" },
  { id: "L5",    name: "Full Listening Test 5",         topic: "Full Listening Practice", difficulty: "Hard", questions: 40, time: "40 min", slug: "full-listening-5" },
  { id: "L6",    name: "Full Listening Test 6",         topic: "Full Listening Practice", difficulty: "Hard", questions: 40, time: "40 min", slug: "full-listening-6" },
  { id: "L7",    name: "Full Listening Test 7",         topic: "Full Listening Practice", difficulty: "Hard", questions: 40, time: "40 min", slug: "full-listening-7" },
  { id: "L8",    name: "Full Listening Test 8",         topic: "Full Listening Practice", difficulty: "Hard", questions: 40, time: "40 min", slug: "full-listening-8" },
  { id: "L9",    name: "Full Listening Test 9",         topic: "Full Listening Practice", difficulty: "Hard", questions: 40, time: "40 min", slug: "full-listening-9" },
  { id: "L10",   name: "Full Listening Test 10",        topic: "Full Listening Practice", difficulty: "Hard", questions: 40, time: "40 min", slug: "full-listening-10" },
  { id: "L11",   name: "Full Listening Test (Bonus)",   topic: "Full Listening Practice", difficulty: "Hard", questions: 40, time: "40 min", slug: "full-listening-base" },
  { id: "LP1",   name: "Listening Prediction Test 1",   topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-1" },
  { id: "LP2",   name: "Listening Prediction Test 2",   topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-2" },
  { id: "LP3",   name: "Listening Prediction Test 3",   topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-3" },
  { id: "LP4",   name: "Listening Prediction Test 4",   topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-4" },
  { id: "LP5",   name: "Listening Prediction Test 5",   topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-5" },
  { id: "LP6",   name: "Listening Prediction Test 6",   topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-6" },
  { id: "LP7",   name: "Listening Prediction Test 7",   topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-7" },
  { id: "LP8",   name: "Listening Prediction Test 8",   topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-8" },
  { id: "LP9",   name: "Listening Prediction Test 9",   topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-9" },
  { id: "LP10",  name: "Listening Prediction Test 10",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-10" },
  { id: "LP11",  name: "Listening Prediction Test 11",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-11" },
  { id: "LP12",  name: "Listening Prediction Test 12",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-12" },
  { id: "LP13",  name: "Listening Prediction Test 13",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-13" },
  { id: "LP14",  name: "Listening Prediction Test 14",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-14" },
  { id: "LP15",  name: "Listening Prediction Test 15",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-15" },
  { id: "LP16",  name: "Listening Prediction Test 16",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-16" },
  { id: "LP17",  name: "Listening Prediction Test 17",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-17" },
  { id: "LP18",  name: "Listening Prediction Test 18",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-18" },
  { id: "LP19",  name: "Listening Prediction Test 19",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-19" },
  { id: "LP20",  name: "Listening Prediction Test 20",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-20" },
  { id: "LP21",  name: "Listening Prediction Test 21",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-21" },
  { id: "LP22",  name: "Listening Prediction Test 22",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-22" },
  { id: "LP23",  name: "Listening Prediction Test 23",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-23" },
  { id: "LP24",  name: "Listening Prediction Test 24",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-24" },
  { id: "LP25",  name: "Listening Prediction Test 25",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-25" },
  { id: "LP26",  name: "Listening Prediction Test 26",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-26" },
  { id: "LP27",  name: "Listening Prediction Test 27",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-27" },
  { id: "LP28",  name: "Listening Prediction Test 28",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-28" },
  { id: "L12",   name: "Full Listening Test 11",        topic: "Full Listening Practice", difficulty: "Hard", questions: 40, time: "40 min", slug: "full-listening-11" },
  { id: "L13",   name: "Full Listening Test 12",        topic: "Full Listening Practice", difficulty: "Hard", questions: 40, time: "40 min", slug: "full-listening-12" },
  { id: "LP29",  name: "Listening Prediction Test 29",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-29" },
  { id: "LP30",  name: "Listening Prediction Test 30",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-30" },
  { id: "LP31",  name: "Listening Prediction Test 31",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-31" },
  { id: "LP32",  name: "Listening Prediction Test 32",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-32" },
  { id: "LP33",  name: "Listening Prediction Test 33",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-33" },
  { id: "LP34",  name: "Listening Prediction Test 34",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-34" },
  { id: "LP35",  name: "Listening Prediction Test 35",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-35" },
  { id: "LP36",  name: "Listening Prediction Test 36",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-36" },
  { id: "LP37",  name: "Listening Prediction Test 37",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-37" },
  { id: "LP38",  name: "Listening Prediction Test 38",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-38" },
  { id: "LP39",  name: "Listening Prediction Test 39",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-39" },
  { id: "LP40",  name: "Listening Prediction Test 40",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-40" },
  { id: "LP41",  name: "Listening Prediction Test 41",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-41" },
  { id: "LP42",  name: "Listening Prediction Test 42",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-42" },
  { id: "LP43",  name: "Listening Prediction Test 43",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-43" },
  { id: "LP44",  name: "Listening Prediction Test 44",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-44" },
  { id: "LP45",  name: "Listening Prediction Test 45",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-45" },
  { id: "LP46",  name: "Listening Prediction Test 46",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-46" },
  { id: "LP47",  name: "Listening Prediction Test 47",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-47" },
  { id: "LP48",  name: "Listening Prediction Test 48",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-48" },
  { id: "LP49",  name: "Listening Prediction Test 49",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-49" },
  { id: "LP50",  name: "Listening Prediction Test 50",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-50" },
  { id: "LP51",  name: "Listening Prediction Test 51",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-51" },
  { id: "LP52",  name: "Listening Prediction Test 52",  topic: "Prediction Test",         difficulty: "Hard", questions: 40, time: "40 min", slug: "listening-52" },
];

const readingPredictionTests: TestItem[] = [
  { id: "1", name: "Australian Parrots", topic: "Adaptation to Habitat Change", difficulty: "Medium", questions: 13, time: "20 min", slug: "australian-parrots" },
  { id: "2", name: "A New Voyage Round the World", topic: "History & Exploration", difficulty: "Medium", questions: 13, time: "20 min", slug: "new-voyage-round-world" },
  { id: "3", name: "A Study of Western Celebrity", topic: "Culture & Society", difficulty: "Hard", questions: 13, time: "20 min", slug: "western-celebrity" },
  { id: "4", name: "A Survivor's Story", topic: "Real Life Narratives", difficulty: "Easy", questions: 13, time: "20 min", slug: "survivors-story" },
  { id: "5", name: "Advantage in Sport", topic: "What is an unfair advantage?", difficulty: "Medium", questions: 13, time: "20 min", slug: "advantage-in-sport" },
  { id: "6", name: "Advantages of Public Transport", topic: "Urban Planning & Environment", difficulty: "Easy", questions: 13, time: "20 min", slug: "public-transport" },
  { id: "7", name: "Andrea Palladio", topic: "Italian Architect", difficulty: "Hard", questions: 13, time: "20 min", slug: "andrea-palladio" },
  { id: "8", name: "Andrea Palladio (Passage 2)", topic: "Architecture & Design", difficulty: "Medium", questions: 13, time: "20 min", slug: "andrea-palladio-2" },
  { id: "9", name: "A New Stage in Study of History", topic: "Academic Research", difficulty: "Hard", questions: 13, time: "20 min", slug: "new-stage-study-history" },
  { id: "10", name: "Antarctic Research", topic: "Science & Environment", difficulty: "Hard", questions: 13, time: "20 min", slug: "antarctic-research" },
  { id: "11", name: "Aphantasia", topic: "Psychology & Cognition", difficulty: "Medium", questions: 13, time: "20 min", slug: "aphantasia" },
  { id: "12", name: "Art and Engineering", topic: "Arts & Technology", difficulty: "Medium", questions: 13, time: "20 min", slug: "art-and-engineering" },
  { id: "13", name: "Attine Ants", topic: "Biology & Nature", difficulty: "Hard", questions: 13, time: "20 min", slug: "attine-ants" },
  { id: "14", name: "Attitudes towards Artificial Intelligence", topic: "Technology & Society", difficulty: "Medium", questions: 13, time: "20 min", slug: "attitudes-ai" },
  { id: "15", name: "Australia's Camouflaged Creatures", topic: "Wildlife & Nature", difficulty: "Easy", questions: 13, time: "20 min", slug: "camouflaged-creatures" },
  { id: "16", name: "Australian Artist Margaret Preston", topic: "Art & Culture", difficulty: "Hard", questions: 13, time: "20 min", slug: "margaret-preston" },
  { id: "17", name: "Bats to the Rescue", topic: "Biology & Ecology", difficulty: "Medium", questions: 13, time: "20 min", slug: "bats-to-the-rescue" },
  { id: "18", name: "Becoming an Expert", topic: "Psychology & Learning", difficulty: "Medium", questions: 13, time: "20 min", slug: "becoming-an-expert" },
  { id: "19", name: "Biology of Bitterness", topic: "Biology & Health", difficulty: "Hard", questions: 13, time: "20 min", slug: "biology-of-bitterness" },
  { id: "20", name: "Biophilic Design", topic: "Architecture & Wellbeing", difficulty: "Medium", questions: 13, time: "20 min", slug: "biophilic-design" },
  { id: "21", name: "Bird Migration", topic: "Zoology & Navigation", difficulty: "Medium", questions: 13, time: "20 min", slug: "bird-migration" },
  { id: "22", name: "Bodie: America's Ghost Town", topic: "History & Culture", difficulty: "Easy", questions: 13, time: "20 min", slug: "bodie-ghost-town" },
  { id: "23", name: "Boring Buildings", topic: "Architecture & Psychology", difficulty: "Medium", questions: 13, time: "20 min", slug: "boring-buildings" },
  { id: "24", name: "Building a Castle", topic: "History & Engineering", difficulty: "Hard", questions: 13, time: "20 min", slug: "building-a-castle" },
  { id: "25", name: "The Burgess Shale Fossils", topic: "Palaeontology & Evolution", difficulty: "Hard", questions: 13, time: "20 min", slug: "burgess-shale-fossils" },
  { id: "26", name: "The Importance of Business Cards", topic: "Business & Culture", difficulty: "Easy", questions: 13, time: "20 min", slug: "business-cards" },
  { id: "27", name: "Business Innovation", topic: "Economics & Business Strategy", difficulty: "Hard", questions: 13, time: "20 min", slug: "business-innovation" },
  { id: "28", name: "Australia's Cane Toad Problem", topic: "Biology & Environment", difficulty: "Easy", questions: 13, time: "20 min", slug: "cane-toad" },
  { id: "29", name: "Caral: An Ancient South American City", topic: "History & Archaeology", difficulty: "Hard", questions: 13, time: "20 min", slug: "caral-ancient-city" },
  { id: "30", name: "Changes in Reading Habits", topic: "Psychology & Education", difficulty: "Medium", questions: 13, time: "20 min", slug: "changes-in-reading-habits" },
  { id: "31", name: "Chilli Peppers", topic: "Food Science & History", difficulty: "Medium", questions: 13, time: "20 min", slug: "chilli-peppers" },
  { id: "32", name: "The History of Chocolate", topic: "Food History & Culture", difficulty: "Easy", questions: 13, time: "20 min", slug: "chocolate" },
  { id: "33", name: "Computer Games", topic: "Technology & Business History", difficulty: "Easy", questions: 13, time: "20 min", slug: "computer-games" },
  { id: "34", name: "Conflicting Climatic Phenomena on Mars", topic: "Science & Astronomy", difficulty: "Hard", questions: 13, time: "20 min", slug: "mars-climate" },
  { id: "35", name: "Corporate Social Responsibility", topic: "Business Ethics & Society", difficulty: "Hard", questions: 13, time: "20 min", slug: "corporate-social-responsibility" },
  { id: "36", name: "Crop-Growing Skyscrapers", topic: "Agriculture & Urban Planning", difficulty: "Medium", questions: 13, time: "20 min", slug: "crop-growing-skyscrapers" },
  { id: "37", name: "CRSP: Investment in Shares", topic: "Finance & Economics", difficulty: "Hard", questions: 13, time: "20 min", slug: "crsp-investment" },
  { id: "38", name: "The Link Between Culture and Thought", topic: "Psychology & Cultural Cognition", difficulty: "Hard", questions: 13, time: "20 min", slug: "culture-and-thought" },
  { id: "39", name: "The Dead Sea Scrolls", topic: "History & Archaeology", difficulty: "Medium", questions: 13, time: "20 min", slug: "dead-sea-scrolls" },
  { id: "40", name: "Decisions, Decisions", topic: "Psychology & Decision Making", difficulty: "Hard", questions: 13, time: "20 min", slug: "decisions-decisions" },
  { id: "41", name: "Decisions, Decisions (II)", topic: "Psychology & Behavioural Science", difficulty: "Medium", questions: 13, time: "20 min", slug: "decisions" },
  { id: "42", name: "Developmental Tasks of Normal Adolescence", topic: "Psychology & Development", difficulty: "Medium", questions: 13, time: "20 min", slug: "developmental-adolescence" },
  { id: "43", name: "A Second Attempt at Domesticating the Tomato", topic: "Biology & Biotechnology", difficulty: "Hard", questions: 13, time: "20 min", slug: "domesticating-the-tomato" },
  { id: "44", name: "Daylight Saving Time", topic: "Society & Policy", difficulty: "Medium", questions: 13, time: "20 min", slug: "daylight-saving-time" },
  { id: "45", name: "E-training", topic: "Technology & Education", difficulty: "Medium", questions: 13, time: "20 min", slug: "e-training" },
  { id: "46", name: "The Early History of Scott & Bowne's Cod Liver Oil", topic: "Business History & Medicine", difficulty: "Easy", questions: 13, time: "20 min", slug: "early-history-scott" },
  { id: "47", name: "What Destroyed the Civilisation of Easter Island?", topic: "History & Archaeology", difficulty: "Hard", questions: 13, time: "20 min", slug: "easter-island" },
  { id: "48", name: "Education Philosophy", topic: "Education & Economics", difficulty: "Hard", questions: 13, time: "20 min", slug: "education-philosophy" },
  { id: "49", name: "Evolutionary Psychology", topic: "Psychology & Organisational Behaviour", difficulty: "Hard", questions: 13, time: "20 min", slug: "evolutionary-psychology" },
  { id: "50", name: "Farmers", topic: "Business History & Retail", difficulty: "Easy", questions: 13, time: "20 min", slug: "farmers" },
  { id: "51", name: "The New Way to Be a Fifth-Grader", topic: "Education & Technology", difficulty: "Medium", questions: 13, time: "20 min", slug: "fifth-grade" },
  { id: "52", name: "An Introduction to Film Sound", topic: "Arts, Film & Culture", difficulty: "Medium", questions: 13, time: "20 min", slug: "film-sound" },
  { id: "53", name: "First Words", topic: "Linguistics & Evolution", difficulty: "Hard", questions: 13, time: "20 min", slug: "first-words" },
  { id: "54", name: "Flower Power", topic: "Biology & Ecology", difficulty: "Medium", questions: 13, time: "20 min", slug: "flower-power" },
  { id: "55", name: "Does Education Fuel Economic Growth?", topic: "Economics & Education", difficulty: "Hard", questions: 13, time: "20 min", slug: "fuel-economic-growth" },
  { id: "56", name: "Going Nowhere Fast", topic: "Technology & Urban Transport", difficulty: "Medium", questions: 13, time: "20 min", slug: "going-nowhere-fast" },
  { id: "57", name: "Gold Dusters", topic: "Biology & Environment", difficulty: "Hard", questions: 13, time: "20 min", slug: "gold" },
  { id: "58", name: "Great Migrations", topic: "Biology & Ecology", difficulty: "Hard", questions: 13, time: "20 min", slug: "great-migrations" },
  { id: "59", name: "Building the Skyline: The Birth and Growth of Manhattan's Skyscrapers", topic: "Urban History & Architecture", difficulty: "Medium", questions: 13, time: "20 min", slug: "growth-of-skyscrapers" },
  { id: "60", name: "Humanities and the Health Professional", topic: "Medicine & Education", difficulty: "Medium", questions: 13, time: "20 min", slug: "health-professional" },
  { id: "61", name: "Historical Impact of the California Gold Rush (II)", topic: "History & Economics", difficulty: "Hard", questions: 13, time: "20 min", slug: "california-gold-rush-2" },
  { id: "62", name: "Historical Impact of the California Gold Rush", topic: "History & Economics", difficulty: "Hard", questions: 13, time: "20 min", slug: "california-gold-rush" },
  { id: "63", name: "The House of the Future, Then and Now", topic: "Technology & Society", difficulty: "Medium", questions: 13, time: "20 min", slug: "house-of-the-future" },
  { id: "64", name: "How the First Trans-Atlantic Telegraph Cable Was Laid (II)", topic: "History & Technology", difficulty: "Hard", questions: 13, time: "20 min", slug: "trans-atlantic-telegraph-2" },
  { id: "65", name: "How the First Trans-Atlantic Telegraph Cable Was Laid", topic: "History & Technology", difficulty: "Hard", questions: 13, time: "20 min", slug: "trans-atlantic-telegraph" },
  { id: "66", name: "How the Other Half Thinks", topic: "Mathematics & Education", difficulty: "Medium", questions: 13, time: "20 min", slug: "how-the-other-half-thinks" },
  { id: "67", name: "Let's Teach Them How to Teach", topic: "Education & Pedagogy", difficulty: "Medium", questions: 13, time: "20 min", slug: "how-to-teach" },
  { id: "68", name: "The History of Ice Cream", topic: "Food Science & History", difficulty: "Easy", questions: 13, time: "20 min", slug: "ice-cream" },
  { id: "69", name: "Ideal Homes", topic: "Architecture & Society", difficulty: "Medium", questions: 13, time: "20 min", slug: "ideal-homes" },
  { id: "70", name: "New Zealand Home Textile Crafts of the 1930s–1950s", topic: "Arts, Crafts & Culture", difficulty: "Easy", questions: 13, time: "20 min", slug: "nz-textile-crafts" },
  { id: "71", name: "Starting School Later Has Positive Effects on Teens", topic: "Education & Health", difficulty: "Easy", questions: 13, time: "20 min", slug: "starting-school-later" },
  { id: "72", name: "The Importance of Icebergs to Ocean Life", topic: "Marine Biology & Environment", difficulty: "Medium", questions: 13, time: "20 min", slug: "importance-of-icebergs" },
  { id: "73", name: "Improving Nutrition at a National and International Level", topic: "Health & Public Policy", difficulty: "Hard", questions: 13, time: "20 min", slug: "improving-nutrition" },
  { id: "74", name: "Improving Patient Safety", topic: "Medicine & Healthcare", difficulty: "Hard", questions: 13, time: "20 min", slug: "improving-patient-safety" },
  { id: "75", name: "Innovation in Business", topic: "Business & Entrepreneurship", difficulty: "Medium", questions: 13, time: "20 min", slug: "innovation-in-business" },
  { id: "76", name: "Inside the Mind of a Fan: How Watching Sport Affects the Brain", topic: "Psychology & Neuroscience", difficulty: "Medium", questions: 13, time: "20 min", slug: "inside-mind-of-fan" },
  { id: "77", name: "Insight or Evolution?", topic: "Science & Innovation", difficulty: "Hard", questions: 13, time: "20 min", slug: "insight-or-evolution" },
  { id: "78", name: "The Italian Architect", topic: "Architecture & History", difficulty: "Hard", questions: 13, time: "20 min", slug: "italian-architect" },
  { id: "79", name: "Jewels from the Sea", topic: "Culture & Indigenous Traditions", difficulty: "Medium", questions: 13, time: "20 min", slug: "jewels-from-the-sea" },
  { id: "80", name: "Conquering Earth's Space Junk Problem", topic: "Science & Technology", difficulty: "Hard", questions: 13, time: "20 min", slug: "junk-problem" },
  { id: "81", name: "Katherine Mansfield", topic: "Literature & Biography", difficulty: "Medium", questions: 13, time: "20 min", slug: "katherine-mansfield" },
  { id: "82", name: "Kedgeree: A Dish with a History", topic: "History & Food Culture", difficulty: "Easy", questions: 13, time: "20 min", slug: "kedgeree" },
  { id: "83", name: "Last Man Standing", topic: "Archaeology & Anthropology", difficulty: "Hard", questions: 13, time: "20 min", slug: "last-man-standing" },
  { id: "84", name: "Listening to the Ocean", topic: "Marine Science & Technology", difficulty: "Hard", questions: 13, time: "20 min", slug: "listening-to-the-ocean" },
  { id: "85", name: "Listening to the Ocean (II)", topic: "Marine Science & Acoustics", difficulty: "Medium", questions: 13, time: "20 min", slug: "listening-to-the-ocean-2" },
  { id: "86", name: "Children's Literature Studies Today", topic: "Education & Literature", difficulty: "Hard", questions: 13, time: "20 min", slug: "literature-studies" },
  { id: "87", name: "Living in a Noisy World", topic: "Health & Society", difficulty: "Medium", questions: 13, time: "20 min", slug: "living-in-noisy-world" },
  { id: "88", name: "Living Dunes", topic: "Biology & Ecology", difficulty: "Medium", questions: 13, time: "20 min", slug: "living-dunes" },
  { id: "89", name: "The Development of the London Underground Railway", topic: "History & Engineering", difficulty: "Medium", questions: 13, time: "20 min", slug: "london-underground" },
  { id: "90", name: "The Conquest of Malaria in Italy", topic: "History & Medicine", difficulty: "Hard", questions: 13, time: "20 min", slug: "malaria-in-italy" },
  { id: "91", name: "Forest Management in Pennsylvania, USA", topic: "Environment & Forestry", difficulty: "Medium", questions: 13, time: "20 min", slug: "management-in-pennsylvania" },
  { id: "92", name: "Marketing and the Information Age", topic: "Business & Technology", difficulty: "Hard", questions: 13, time: "20 min", slug: "marketing-information-age" },
  { id: "93", name: "Marketing and the Information Age (II)", topic: "Business & Economics", difficulty: "Hard", questions: 13, time: "20 min", slug: "marketing-information-age-2" },
  { id: "94", name: "This Marvellous Invention", topic: "Linguistics & Language", difficulty: "Hard", questions: 13, time: "20 min", slug: "marvellous-invention" },
  { id: "95", name: "The Return of Monkey Life", topic: "Biology & Conservation", difficulty: "Medium", questions: 13, time: "20 min", slug: "monkey-life" },
  { id: "96", name: "The Significant Role of Mother Tongue in Education", topic: "Linguistics & Education", difficulty: "Medium", questions: 13, time: "20 min", slug: "mother-tongue-in-education" },
  { id: "97", name: "Classical Music Over the Centuries", topic: "Music History & Culture", difficulty: "Medium", questions: 13, time: "20 min", slug: "music-over-the-centuries" },
  { id: "98", name: "Neanderthal Technology", topic: "Archaeology & Prehistory", difficulty: "Hard", questions: 13, time: "20 min", slug: "neanderthal-technology" },
  { id: "99", name: "Neuroaesthetics", topic: "Neuroscience & Art", difficulty: "Hard", questions: 13, time: "20 min", slug: "neuroaesthetics" },
  { id: "100", name: "New Perspectives on Food Production", topic: "Agriculture & Sustainability", difficulty: "Hard", questions: 13, time: "20 min", slug: "new-perspectives-food-production" },
  { id: "101", name: "New Ways of Teaching History", topic: "Education & Pedagogy", difficulty: "Medium", questions: 13, time: "20 min", slug: "new-ways-teaching-history" },
  { id: "102", name: "Norway's Glaciers", topic: "Archaeology & Climate Change", difficulty: "Medium", questions: 13, time: "20 min", slug: "norways-glaciers" },
  { id: "103", name: "The Olympic Torch", topic: "History & Sport", difficulty: "Easy", questions: 13, time: "20 min", slug: "olympic-torch" },
  { id: "104", name: "Palm Oil", topic: "Environment & Economics", difficulty: "Medium", questions: 13, time: "20 min", slug: "palm-oil" },
  { id: "105", name: "The National Parks of America", topic: "History & Conservation", difficulty: "Medium", questions: 13, time: "20 min", slug: "parks-of-america" },
  { id: "106", name: "Unfair Advantage in Sport", topic: "Ethics & Sport Science", difficulty: "Hard", questions: 13, time: "20 min", slug: "unfair-advantage-in-sport" },
  { id: "107", name: "Conformity", topic: "Psychology & Social Behaviour", difficulty: "Hard", questions: 13, time: "20 min", slug: "conformity" },
  { id: "108", name: "Theories of Planet Formation", topic: "Astronomy & Science", difficulty: "Hard", questions: 13, time: "20 min", slug: "theories-planet-formation" },
  { id: "109", name: "Paternity Leave", topic: "Society & Policy", difficulty: "Medium", questions: 13, time: "20 min", slug: "paternity-leave" },
  { id: "110", name: "Playing Soccer", topic: "Sport Science & Health", difficulty: "Medium", questions: 13, time: "20 min", slug: "playing-soccer" },
  { id: "111", name: "Preserving Antarctic History", topic: "History & Conservation", difficulty: "Hard", questions: 13, time: "20 min", slug: "preserving-antarctic-history" },
  { id: "112", name: "The Pyramid of Djoser", topic: "History & Archaeology", difficulty: "Medium", questions: 13, time: "20 min", slug: "pyramid-of-djoser" },
  { id: "113", name: "Rainforests", topic: "Environment & Education", difficulty: "Easy", questions: 13, time: "20 min", slug: "rainforests" },
  { id: "114", name: "Born to Trade", topic: "Anthropology & Economics", difficulty: "Hard", questions: 13, time: "20 min", slug: "born-to-trade" },
  { id: "115", name: "Egypt's Ancient Boat-Builders", topic: "History & Archaeology", difficulty: "Hard", questions: 13, time: "20 min", slug: "egypts-ancient-boat-builders" },
  { id: "116", name: "The Communication of Science", topic: "Science & Society", difficulty: "Hard", questions: 13, time: "20 min", slug: "communication-of-science" },
  { id: "117", name: "Reading", topic: "Literacy & Education", difficulty: "Medium", questions: 13, time: "20 min", slug: "reading" },
  { id: "118", name: "Removing Unwanted Noise (1)", topic: "Science & Technology", difficulty: "Medium", questions: 13, time: "20 min", slug: "removing-unwanted-noise-1" },
  { id: "119", name: "Removing Unwanted Noise (2)", topic: "Science & Technology", difficulty: "Hard", questions: 13, time: "20 min", slug: "removing-unwanted-noise-2" },
  { id: "120", name: "Research Using Twins", topic: "Genetics & Psychology", difficulty: "Hard", questions: 13, time: "20 min", slug: "research-using-twins" },
  { id: "121", name: "Rewilding", topic: "Environment & Conservation", difficulty: "Medium", questions: 13, time: "20 min", slug: "rewilding" },
  { id: "122", name: "Orientation of Birds", topic: "Biology & Animal Behaviour", difficulty: "Hard", questions: 13, time: "20 min", slug: "orientation-of-birds" },
  { id: "123", name: "Robert Louis Stevenson", topic: "Literature & Biography", difficulty: "Medium", questions: 13, time: "20 min", slug: "robert-louis-stevenson" },
  { id: "124", name: "Roman Tunnels", topic: "History & Engineering", difficulty: "Medium", questions: 13, time: "20 min", slug: "roman-tunnels" },
  { id: "125", name: "Protect Polar Bears", topic: "Environment & Conservation", difficulty: "Medium", questions: 13, time: "20 min", slug: "protect-polar-bears" },
  { id: "126", name: "Science and the Stradivarius", topic: "Science & Music", difficulty: "Hard", questions: 13, time: "20 min", slug: "science-and-stradivarius" },
  { id: "127", name: "The Secret of Long Life", topic: "Biology & Health", difficulty: "Medium", questions: 13, time: "20 min", slug: "secret-of-long-life" },
  { id: "128", name: "Seed Hunting", topic: "Botany & Conservation", difficulty: "Medium", questions: 13, time: "20 min", slug: "seed-hunting" },
  { id: "129", name: "Shipbuilding and Navigation", topic: "History & Engineering", difficulty: "Hard", questions: 13, time: "20 min", slug: "shipbuilding-and-navigation" },
  { id: "130", name: "Some Views on the Use of Headphones", topic: "Technology & Health", difficulty: "Medium", questions: 13, time: "20 min", slug: "views-on-headphones" },
  { id: "131", name: "Space Foundation", topic: "Astronomy & Space Exploration", difficulty: "Hard", questions: 13, time: "20 min", slug: "space-foundation" },
  { id: "132", name: "Stadiums", topic: "Architecture & Sport", difficulty: "Medium", questions: 13, time: "20 min", slug: "stadiums" },
  { id: "133", name: "Studies in the History of Art and Visual Culture", topic: "Art History & Education", difficulty: "Hard", questions: 13, time: "20 min", slug: "studies-history-art-visual-culture" },
  { id: "134", name: "Swarm Theory", topic: "Biology & Behaviour", difficulty: "Hard", questions: 13, time: "20 min", slug: "swarm-theory" },
  { id: "135", name: "Television Advertising", topic: "Media & Marketing", difficulty: "Medium", questions: 13, time: "20 min", slug: "television-advertising" },
  { id: "136", name: "Termite Mounds", topic: "Biology & Architecture", difficulty: "Medium", questions: 13, time: "20 min", slug: "termite-mounds" },
  { id: "137", name: "The Art of Deception", topic: "Psychology & Behaviour", difficulty: "Hard", questions: 13, time: "20 min", slug: "the-art-of-deception" },
  { id: "138", name: "The Attraction of Video Games (1)", topic: "Psychology & Technology", difficulty: "Medium", questions: 13, time: "20 min", slug: "the-attraction-of-video-games-1" },
  { id: "139", name: "The Attraction of Video Games", topic: "Psychology & Technology", difficulty: "Medium", questions: 13, time: "20 min", slug: "the-attraction-of-video-games" },
  { id: "140", name: "The Benefits of Learning an Instrument", topic: "Psychology & Music", difficulty: "Medium", questions: 13, time: "20 min", slug: "the-benefits-of-learning-an-instrument" },
  { id: "141", name: "The Bug Picture", topic: "Biology & Environment", difficulty: "Medium", questions: 13, time: "20 min", slug: "the-bug-picture" },
  { id: "142", name: "The Cane Toad in Australia", topic: "Biology & Ecology", difficulty: "Medium", questions: 13, time: "20 min", slug: "the-cane-toad-in-australia" },
  { id: "143", name: "The Cause of Linguistic Change (1)", topic: "Linguistics & Society", difficulty: "Hard", questions: 13, time: "20 min", slug: "the-cause-of-linguistic-change-1" },
  { id: "144", name: "The Cause of Linguistic Change", topic: "Linguistics & Society", difficulty: "Hard", questions: 13, time: "20 min", slug: "the-cause-of-linguistic-change" },
  { id: "145", name: "The Discovery of a Baby Mammoth", topic: "Palaeontology & Science", difficulty: "Hard", questions: 13, time: "20 min", slug: "the-discovery-of-a-baby-mammoth" },
  { id: "146", name: "The Effectiveness of an Online Course", topic: "Education & Technology", difficulty: "Medium", questions: 13, time: "20 min", slug: "the-effectiveness-of-an-online-course" },
  { id: "147", name: "The Extinction of Cave Bears", topic: "Palaeontology & Environment", difficulty: "Hard", questions: 13, time: "20 min", slug: "the-extinction-of-cave-bears" },
  { id: "148", name: "The Fascinating World of Attine Ants", topic: "Biology & Ecology", difficulty: "Hard", questions: 13, time: "20 min", slug: "the-fascinating-world-of-attine-ants" },
  { id: "149", name: "The Father of English Geology", topic: "History of Science", difficulty: "Medium", questions: 13, time: "20 min", slug: "the-father-of-english-geology" },
  { id: "150", name: "The Fluoridation Controversy", topic: "Science & Public Health", difficulty: "Hard", questions: 13, time: "20 min", slug: "the-fluoridation-controversy" },
  { id: "151", name: "The Growing Industry of Background Music", topic: "Music & Commerce", difficulty: "Medium", questions: 13, time: "20 min", slug: "the-growing-industry-of-background-music" },
  { id: "152", name: "The Impact of the Potato", topic: "History & Agriculture", difficulty: "Medium", questions: 13, time: "20 min", slug: "the-impact-of-the-potato" },
  { id: "153", name: "The Long View", topic: "Science & Society", difficulty: "Medium", questions: 13, time: "20 min", slug: "the-long-view" },
  { id: "154", name: "The Nuisance of Noise", topic: "Health & Environment", difficulty: "Medium", questions: 13, time: "20 min", slug: "the-nuisance-of-noise" },
  { id: "155", name: "The Origin of Ancient Writing (1)", topic: "History & Archaeology", difficulty: "Hard", questions: 13, time: "20 min", slug: "the-origin-of-ancient-writing-1" },
  { id: "156", name: "The Origin of Ancient Writing", topic: "History & Archaeology", difficulty: "Hard", questions: 13, time: "20 min", slug: "the-origin-of-ancient-writing" },
  { id: "157", name: "The Pearl", topic: "Nature & Marine Biology", difficulty: "Medium", questions: 13, time: "20 min", slug: "the-pearl" },
  { id: "158", name: "The Peopling of Patagonia", topic: "History & Anthropology", difficulty: "Hard", questions: 13, time: "20 min", slug: "the-peopling-of-patagonia" },
  { id: "159", name: "The Plan to Bring an Asteroid to Earth", topic: "Science & Space Exploration", difficulty: "Hard", questions: 13, time: "20 min", slug: "the-plan-to-bring-an-asteroid-to-earth" },
  { id: "160", name: "The Purpose of Facial Expressions", topic: "Psychology & Biology", difficulty: "Medium", questions: 13, time: "20 min", slug: "the-purpose-of-facial-expressions" },
  { id: "161", name: "The Pyramid of Cestius", topic: "History & Architecture", difficulty: "Medium", questions: 13, time: "20 min", slug: "the-pyramid-of-cestius" },
  { id: "162", name: "The Rise of Multicultural London English", topic: "Linguistics & Society", difficulty: "Hard", questions: 13, time: "20 min", slug: "the-rise-of-multicultural-london-english" },
  { id: "163", name: "The Role of Accidents in Business", topic: "Business & Innovation", difficulty: "Medium", questions: 13, time: "20 min", slug: "the-role-of-accidents-in-business" },
  { id: "164", name: "The Voynich Manuscript", topic: "History & Mystery", difficulty: "Hard", questions: 13, time: "20 min", slug: "the-voynich-manuscript" },
  { id: "165", name: "The Women Scientists of Bologna", topic: "History & Science", difficulty: "Hard", questions: 13, time: "20 min", slug: "the-women-scientists-of-bologna" },
  { id: "166", name: "The Art of Deception", topic: "Psychology & Society", difficulty: "Medium", questions: 13, time: "20 min", slug: "theartofdeception" },
  { id: "167", name: "The Clipper Races", topic: "History & Adventure", difficulty: "Medium", questions: 13, time: "20 min", slug: "the-clipper-races" },
  { id: "168", name: "The Falkirk Wheel", topic: "Engineering & Technology", difficulty: "Medium", questions: 13, time: "20 min", slug: "the-falkirk-wheel" },
  { id: "169", name: "The History of the Poster", topic: "Art & Communication", difficulty: "Easy", questions: 13, time: "20 min", slug: "the-history-the-poster" },
  { id: "170", name: "The Importance of Law", topic: "Society & Governance", difficulty: "Medium", questions: 13, time: "20 min", slug: "the-importance-of-law" },
  { id: "171", name: "The Thermometer", topic: "Science & History of Invention", difficulty: "Easy", questions: 13, time: "20 min", slug: "thermometer" },
  { id: "172", name: "The Story of Silk", topic: "History & Trade", difficulty: "Easy", questions: 13, time: "20 min", slug: "the-story-of-silk" },
  { id: "173", name: "The Tasmanian Tiger", topic: "Biology & Conservation", difficulty: "Medium", questions: 13, time: "20 min", slug: "the-tasmanian-tiger" },
  { id: "174", name: "The Thylacine", topic: "Biology & Extinction", difficulty: "Hard", questions: 13, time: "20 min", slug: "the-thylacine" },
  { id: "175", name: "The Voynich Manuscript (II)", topic: "History & Cryptography", difficulty: "Hard", questions: 13, time: "20 min", slug: "the-voynich-manuscript-2" },
  { id: "176", name: "Tidal Power", topic: "Energy & Environment", difficulty: "Medium", questions: 13, time: "20 min", slug: "tidal-power" },
  { id: "177", name: "Timur Gareyev — Blindfold Chess Champion", topic: "Psychology & Memory", difficulty: "Hard", questions: 13, time: "20 min", slug: "timur-gareyev" },
  { id: "178", name: "To Catch a King", topic: "History & Literature", difficulty: "Hard", questions: 13, time: "20 min", slug: "to-catch-a-king" },
  { id: "179", name: "Tool for Ancient Writing", topic: "History & Archaeology", difficulty: "Hard", questions: 13, time: "20 min", slug: "tool-for-ancient-writing" },
  { id: "180", name: "Traffic Jams", topic: "Urban Planning & Technology", difficulty: "Medium", questions: 13, time: "20 min", slug: "traffic-jams" },
  { id: "181", name: "Tunnelling Under the Thames", topic: "Engineering & History", difficulty: "Medium", questions: 13, time: "20 min", slug: "tunnelling-under-the-thames" },
  { id: "182", name: "Undoing Our Emotions", topic: "Psychology & Health", difficulty: "Hard", questions: 13, time: "20 min", slug: "undoing-our-emotions" },
  { id: "183", name: "Urban Farming", topic: "Agriculture & Environment", difficulty: "Medium", questions: 13, time: "20 min", slug: "urban-farming" },
  { id: "184", name: "Violins and Very Cold Weather", topic: "Science & Music History", difficulty: "Hard", questions: 13, time: "20 min", slug: "violins-and-very-cold-weather" },
  { id: "185", name: "Visual Symbols and the Blind", topic: "Psychology & Perception", difficulty: "Hard", questions: 13, time: "20 min", slug: "visual-symbols-and-the-blind" },
  { id: "186", name: "Visual Symbols and the Blind (II)", topic: "Psychology & Cognition", difficulty: "Hard", questions: 13, time: "20 min", slug: "visual-symbols-and-the-blind-2" },
  { id: "187", name: "The Voynich Manuscript (III)", topic: "History & Cryptography", difficulty: "Hard", questions: 13, time: "20 min", slug: "voynich-manuscript-3" },
  { id: "188", name: "Are We Born Able to Imitate?", topic: "Psychology & Development", difficulty: "Hard", questions: 13, time: "20 min", slug: "we-born-able-to-imitate" },
  { id: "189", name: "Whale Culture", topic: "Biology & Animal Behaviour", difficulty: "Hard", questions: 13, time: "20 min", slug: "whale-culture" },
  { id: "190", name: "What is an Unfair Advantage in Sport?", topic: "Sport & Ethics", difficulty: "Medium", questions: 13, time: "20 min", slug: "what-is-unfair-advantage-sport" },
  { id: "191", name: "What is the Secret of a Long Life?", topic: "Health & Science", difficulty: "Medium", questions: 13, time: "20 min", slug: "secret-of-a-long-life" },
  { id: "192", name: "What Kind of Structure Will Make Living in Space Comfortable?", topic: "Science & Space Exploration", difficulty: "Hard", questions: 13, time: "20 min", slug: "living-in-space" },
  { id: "193", name: "What's Happening to Our Food?", topic: "Food Science & Society", difficulty: "Medium", questions: 13, time: "20 min", slug: "whats-happening-to-our-food" },
  { id: "194", name: "When Maps Were Made for the Public", topic: "History & Cartography", difficulty: "Hard", questions: 13, time: "20 min", slug: "when-maps-were-made-for-public" },
  { id: "195", name: "Sorry — Who Are You?", topic: "Psychology & Neuroscience", difficulty: "Medium", questions: 13, time: "20 min", slug: "who-are-you" },
  { id: "196", name: "Why Are Humboldt Squid Thriving?", topic: "Biology & Marine Science", difficulty: "Hard", questions: 13, time: "20 min", slug: "why-humboldt-squid-thriving" },
  { id: "197", name: "Why Good Ideas Fail", topic: "Business & Innovation", difficulty: "Hard", questions: 13, time: "20 min", slug: "why-good-ideas-fail" },
  { id: "198", name: "Willpower (Extended)", topic: "Psychology & Self-Control", difficulty: "Hard", questions: 13, time: "20 min", slug: "willpower-full" },
  { id: "199", name: "Willpower", topic: "Psychology & Self-Control", difficulty: "Medium", questions: 13, time: "20 min", slug: "willpower" },
  { id: "200", name: "How to Make Wise Decisions", topic: "Psychology & Decision Making", difficulty: "Hard", questions: 13, time: "20 min", slug: "wise-decisions" },
  { id: "201", name: "Achieving a Work–Life Balance", topic: "Society & Workplace", difficulty: "Medium", questions: 13, time: "20 min", slug: "work-life-balance" },
  { id: "202", name: "The Future of the World's Languages", topic: "Linguistics & Culture", difficulty: "Hard", questions: 13, time: "20 min", slug: "worlds-languages" },
  { id: "203", name: "Yawning", topic: "Biology & Psychology", difficulty: "Medium", questions: 13, time: "20 min", slug: "yawning" },
  { id: "204", name: "Full Practice: Copy Your Neighbour / Tasmanian Tiger / E-training", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "practice-full-reading" },
  { id: "205", name: "Practice 1: Deforestation / Film Noir", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "practice-reading-1" },
  { id: "206", name: "Practice 2: T-Rex Hunter / Paleobiology / Personality", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "practice-reading-2" },
  { id: "207", name: "Practice 3: Hold Back the Flood / Life-Casting / Reading Teaching", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "practice-reading-3" },
  { id: "208", name: "Practice 4: History of Tea / Reclaiming the Night / Paper or Computer", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "practice-reading-4" },
  { id: "209", name: "Practice 5: Green Revolution / Space Tourism / Climate Change", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "practice-reading-5" },
  { id: "210", name: "Practice 6: Dirty River / Memory and Age / Endangered Language", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "practice-reading-6" },
  { id: "211", name: "Practice 7: Bondi Beach / Antarctica / Talc Powder", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "practice-reading-7" },
  { id: "212", name: "Practice 8: Natural Pesticide / Mammoth Kill / Language Strategy", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "practice-reading-8" },
  { id: "213", name: "Practice 9: What Are You Laughing At? / Leaf-Cutting Ants / Risk", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "practice-reading-9" },
  { id: "214", name: "Practice 10: New Agriculture / Crocodile / Learning from the Past", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "practice-reading-10" },
  { id: "215", name: "Practice 11: New Agriculture / Plain English / Follow Your Nose", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "practice-reading-11" },
  { id: "216", name: "Practice 12: Bristlecone Pine / Ancient Storytelling / Music", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "practice-reading-12" },
  { id: "217", name: "Practice 13: Beyond the Blue Line / Smell and Memory / Conflict", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "practice-reading-13" },
  { id: "218", name: "Practice 14: California Megafires / Griffith's Films / Eco Vehicles", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "practice-reading-14" },
  { id: "219", name: "Practice 15: SOSUS / Western Immigration / Science Communication", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "practice-reading-15" },
  { id: "220", name: "Practice 16: Food Advertising / Finding Our Way / Child Compliance", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "practice-reading-16" },
  { id: "221", name: "Practice 17: Watkin Tench / Carbolic Smoke Ball / Conflict Styles", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "practice-reading-17" },
  { id: "222", name: "Practice 18: Emperor Penguins / Water Filter / High Speed Photography", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "practice-reading-18" },
  { id: "223", name: "Practice 19: Soap / The Sun / Exploration of Mars", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "practice-reading-19" },
  { id: "224", name: "Practice 20: Sleep / Hypnotherapy / Metropolis", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "practice-reading-20" },
  { id: "225", name: "Reading 1: Dinosaur Footprints / Art in Iron and Steel / Beyond the Blue Line", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "reading-1" },
  { id: "226", name: "Reading 2: The Forgotten Forest / Wealth in Cold Climate / Motivating Drives", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "reading-2" },
  { id: "227", name: "Reading: Extinct Grass / Talbot Park / Thinking Fast and Slow", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "reading-base" },
  { id: "228", name: "Practice 21: Blue-footed Boobies / Hunting Perfume / Mathematics", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "practice-reading-21" },
  { id: "229", name: "Practice 22: Culture of Chimpanzee / Agritourism / Oil Business", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "practice-reading-22" },
  { id: "230", name: "Practice 23: Spider Silk / TV Addiction / The Power of Nothing", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "practice-reading-23" },
  { id: "231", name: "Practice 24: Science of Yawning / Language in Business / Fight Against Polio", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "practice-reading-24" },
  { id: "232", name: "Practice 25: The Pearl / History of Automobiles / What Do Babies Know?", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "practice-reading-25" },
  { id: "233", name: "Practice 26: Bricks / Star Performers / Knowledge in Medicine", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "practice-reading-26" },
  { id: "234", name: "Reading 3: Koalas / A New Ice Age / Mimicking Mother Nature", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "reading-3" },
  { id: "235", name: "Reading 4: The Adolescents / Ancient Chinese Chariots / Amateur Naturalists", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "reading-4" },
  { id: "236", name: "Reading 5: Watkin Tench / Stress of Workplace / Improving Patient Safety", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "reading-5" },
  { id: "237", name: "Reading 6: Bricks / Star Performers / Knowledge in Medicine", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "reading-6" },
  { id: "238", name: "Reading 7: Culture of Chimpanzee / Agritourism / Sunset for Oil Business", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "reading-7" },
  { id: "239", name: "Reading 8: Natural Pesticide / Mammoth Kill / Language Strategy", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "reading-8" },
  { id: "240", name: "Reading 9: Emperor Penguins / Water Filter / High Speed Photography", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "reading-9" },
  { id: "241", name: "Reading 10: Science of Yawning / Language in Business / Fight Against Polio", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "reading-10" },
  { id: "242", name: "Reading 11: SOSUS / Western Immigration / Communication in Science", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "reading-11" },
  { id: "243", name: "Reading 12: Spider Silk / TV Addiction / The Power of Nothing", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "reading-12" },
  { id: "244", name: "Reading 13: Bondi Beach / Antarctica / Talc Powder", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "reading-13" },
  { id: "245", name: "Reading 14: Food Advertising / Finding Our Way / Child Compliance", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "reading-14" },
  { id: "246", name: "Reading 15: Blue-footed Boobies / Hunting Perfume / Mathematics", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "reading-15" },
  { id: "247", name: "Reading 16: Effects of Deforestation / Film Noir", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "reading-16" },
  { id: "248", name: "Reading 17: California Megafires / Griffith and American Films / Eco Vehicles", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "reading-17" },
  { id: "249", name: "Reading 18: The Silk Industry / Baby Mammoth Discovery / Musical Expert", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "reading-18" },
  { id: "250", name: "Reading 19: Language Development / Children's TV Advertising / New Voyage / Cuneiform", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "reading-19" },
  { id: "251", name: "Reading 20: The Paradox of Choice / False Belief Experiments / Musical Maladies", topic: "Full Practice Test", difficulty: "Hard", questions: 40, time: "60 min", slug: "reading-20" },
];

const difficultyColor: Record<string, string> = {
  Easy: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Hard: "bg-red-100 text-red-700 border-red-200",
};

const IELTSPrep = () => {
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [selectedType, setSelectedType] = useState<TestType | null>(null);
  const [tests, setTests] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const level = selectedType ? 3 : selectedSkill ? 2 : 1;

  const animate = (dir: "forward" | "back", cb: () => void) => {
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      cb();
      setAnimating(false);
    }, 250);
  };

  const goToSkill = (skill: Skill) => animate("forward", () => setSelectedSkill(skill));
  const goToType = (type: TestType) => animate("forward", () => setSelectedType(type));

  const goBack = () => {
    if (selectedType) {
      animate("back", () => { setSelectedType(null); setTests([]); setError(null); });
    } else if (selectedSkill) {
      animate("back", () => setSelectedSkill(null));
    }
  };

  useEffect(() => {
    if (!selectedSkill || !selectedType) return;

    if (selectedSkill === "reading" && selectedType === "predictions") {
      setTests(readingPredictionTests);
      return;
    }

    if (selectedSkill === "listening" && selectedType === "predictions") {
      setTests(listeningPredictionTests);
      return;
    }

    setLoading(true);
    setError(null);
    setTimeout(() => {
      setLoading(false);
      setTests([]);
    }, 500);
  }, [selectedSkill, selectedType]);

  const slideClass = animating
    ? direction === "forward" ? "animate-slide-in-forward" : "animate-slide-in-back"
    : "";

  const skillLabel = selectedSkill ? skills.find((s) => s.id === selectedSkill)?.title : "";
  const typeLabel = selectedType ? testTypes.find((t) => t.id === selectedType)?.title : "";

  return (
    <Layout>
      <section className="hero-gradient py-16 text-primary-foreground">
        <div className="container text-center">
          <h1 className="text-4xl font-bold md:text-5xl">IELTS Preparation</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg opacity-90">
            Master all 4 skills with structured guides and real practice tests
          </p>
        </div>
      </section>

      <div className="container pt-8 pb-2">
        <div className="flex items-center gap-4">
          {level > 1 && (
            <Button variant="ghost" size="sm" onClick={goBack} className="gap-1 text-muted-foreground">
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
          )}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                {level === 1 ? (
                  <BreadcrumbPage>IELTS</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    className="cursor-pointer"
                    onClick={() => animate("back", () => { setSelectedSkill(null); setSelectedType(null); setTests([]); })}
                  >
                    IELTS
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {selectedSkill && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {level === 2 ? (
                      <BreadcrumbPage>{skillLabel}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        className="cursor-pointer"
                        onClick={() => animate("back", () => { setSelectedType(null); setTests([]); })}
                      >
                        {skillLabel}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </>
              )}
              {selectedType && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{typeLabel}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <section className="container pb-20">
        <div className={`transition-all duration-250 ${slideClass}`}>
          {level === 1 && (
            <>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {skills.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => goToSkill(s.id)}
                    className="group flex flex-col rounded-xl border bg-card p-8 shadow-sm text-left transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary/40"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <s.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-card-foreground">{s.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground flex-1">{s.description}</p>
                    <span className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                      View Tests <ChevronRight className="h-4 w-4" />
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {level === 2 && (
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {testTypes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => goToType(t.id)}
                  className="group flex flex-col rounded-xl border bg-card p-8 shadow-sm text-left transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary/40"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <t.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground">{t.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground flex-1">{t.description}</p>
                  <span className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                    View Tests <ChevronRight className="h-4 w-4" />
                  </span>
                </button>
              ))}
            </div>
          )}

          {level === 3 && (
            <div className="mt-4">
              {loading && (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-3" />
                  <p>Loading tests…</p>
                </div>
              )}

              {error && (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mb-3 text-destructive" />
                  <p className="text-sm">No tests available yet. Check back soon!</p>
                </div>
              )}

              {!loading && !error && tests.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <ClipboardList className="h-8 w-8 mb-3" />
                  <p>No tests found in this category yet.</p>
                </div>
              )}

              {!loading && !error && tests.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {tests.map((t, i) => (
                    <div
                      key={t.id}
                      className="group flex flex-col rounded-xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Test {i + 1}</span>
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${difficultyColor[t.difficulty] || difficultyColor.Medium}`}>
                          {t.difficulty}
                        </span>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold text-card-foreground">{t.name}</h3>
                      {t.topic && <p className="mt-1 text-sm text-muted-foreground">{t.topic}</p>}
                      <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <HelpCircle className="h-4 w-4" /> {t.questions} questions
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" /> {t.time}
                        </span>
                      </div>
                      <Button
                        className="mt-6"
                        size="sm"
                        onClick={() => {
                          if (t.slug) {
                            nav(`/ielts/test/${t.slug}`);
                          }
                        }}
                        disabled={!t.slug}
                      >
                        Start Test
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default IELTSPrep;
