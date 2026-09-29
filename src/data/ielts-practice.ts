export const writingPrompts = [
  {
    id: "task1-library",
    task: 1,
    title: "Library visits",
    instruction: "The table shows visits to three facilities in a city library in 2015 and 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    columns: ["Facility", "2015", "2025"],
    rows: [["Study rooms", "18,000", "32,000"], ["Computer area", "24,000", "15,000"], ["Children’s section", "12,000", "28,000"]],
    minimumWords: 150,
    suggestedMinutes: 20,
  },
  {
    id: "task1-transport",
    task: 1,
    title: "Travel to work",
    instruction: "The table shows the percentage of commuters using different forms of transport in two towns in 2024. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    columns: ["Transport", "Northbridge", "Southport"],
    rows: [["Car", "52%", "38%"], ["Bus", "21%", "32%"], ["Train", "17%", "20%"], ["Walking or cycling", "10%", "10%"]],
    minimumWords: 150,
    suggestedMinutes: 20,
  },
  {
    id: "task2-remote-work",
    task: 2,
    title: "Remote work",
    instruction: "Some people believe that working from home improves productivity and quality of life. Others think that it weakens teamwork and learning at work. Discuss both views and give your own opinion.",
    minimumWords: 250,
    suggestedMinutes: 40,
  },
  {
    id: "task2-public-spaces",
    task: 2,
    title: "Public spaces",
    instruction: "Cities should spend more money on parks and public spaces than on new roads. To what extent do you agree or disagree? Give reasons for your answer and include relevant examples from your knowledge or experience.",
    minimumWords: 250,
    suggestedMinutes: 40,
  },
  {
    id: "task2-skills",
    task: 2,
    title: "Practical skills in schools",
    instruction: "Some people argue that schools should devote more time to practical life skills, such as managing money, while others believe traditional academic subjects should remain the priority. Discuss both views and give your own opinion.",
    minimumWords: 250,
    suggestedMinutes: 40,
  },
] as const;

export const speakingPrompts = [
  { id: "neighbourhood", title: "Your neighbourhood", part1: ["What do you like about the area where you live?", "How has your neighbourhood changed recently?", "Would you like to live there in the future?"], cue: "Describe a place in your neighbourhood that you enjoy visiting.", points: ["where it is", "what people do there", "when you usually go there", "why you enjoy it"], part3: ["What makes a public place welcoming?", "How can cities protect places that local people value?", "Do young and older people use public spaces differently?"] },
  { id: "learning", title: "Learning something new", part1: ["What do you enjoy learning?", "Do you prefer learning alone or with others?", "What is a skill you would like to improve?"], cue: "Describe something useful you learned outside school.", points: ["what it was", "how you learned it", "when you first used it", "why it was useful"], part3: ["What motivates adults to keep learning?", "Should employers help workers learn new skills?", "How has technology changed the way people learn?"] },
  { id: "journeys", title: "Travel and journeys", part1: ["How do you usually travel around your city?", "Do you enjoy long journeys?", "What transport would you like to use more often?"], cue: "Describe a journey that you remember well.", points: ["where you went", "who travelled with you", "what happened during the journey", "why you remember it"], part3: ["Why do people choose different kinds of transport?", "How might travel change in the future?", "Should governments encourage public transport?"] },
  { id: "celebrations", title: "Celebrations", part1: ["Do you enjoy celebrations?", "What occasions does your family celebrate?", "Do you prefer small or large gatherings?"], cue: "Describe a celebration you attended.", points: ["what it celebrated", "where it took place", "who was there", "why it was memorable"], part3: ["Why are celebrations important to communities?", "Have celebrations become too expensive?", "How do traditions change between generations?"] },
  { id: "technology", title: "Everyday technology", part1: ["What technology do you use every day?", "Is there a device you find difficult to use?", "Do you enjoy trying new technology?"], cue: "Describe a piece of technology that helped you solve a problem.", points: ["what it was", "what problem you had", "how you used it", "why it helped"], part3: ["How should children learn to use technology responsibly?", "Can technology make daily life more complicated?", "What inventions might be important in the next decade?"] },
] as const;
