export interface BranchCategory {
  category: string;
  branches: string[];
}

export const BRANCH_CATEGORIES: BranchCategory[] = [
  {
    category: "Computer Science & Emerging Tech",
    branches: [
      "CSE – Computer Science and Engineering",
      "CSE (AI & ML) – Artificial Intelligence and Machine Learning",
      "AIDS – Artificial Intelligence and Data Science",
      "CSE (Cybersecurity)",
      "CSE (IoT)",
      "CSE (Data Science)",
      "CSE (Blockchain)",
      "IT – Information Technology",
      "CSBS – Computer Science and Business Systems",
    ],
  },
  {
    category: "Core Branches",
    branches: [
      "Mechanical Engineering",
      "Civil Engineering",
      "Electrical Engineering (EE)",
      "Electronics and Communication Engineering (ECE)",
      "Electronics and Telecommunication (E&TC)",
      "Chemical Engineering",
    ],
  },
  {
    category: "Interdisciplinary & Emerging Branches",
    branches: [
      "Mechatronics Engineering",
      "Robotics and Automation",
      "Instrumentation Engineering",
      "Electronics and Instrumentation (E&I)",
      "Automobile Engineering",
      "Industrial Engineering",
    ],
  },
  {
    category: "Specialized Branches",
    branches: [
      "Aerospace/Aeronautical Engineering",
      "Biomedical Engineering",
      "Biotechnology",
      "Metallurgical Engineering",
      "Mining Engineering",
      "Textile Engineering",
      "Petroleum Engineering",
      "Marine Engineering",
      "Agricultural Engineering",
      "Production Engineering",
      "Environmental Engineering",
      "Polymer Engineering",
    ],
  },
];

export const ALL_BRANCHES = BRANCH_CATEGORIES.flatMap((cat) => cat.branches);
