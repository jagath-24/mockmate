export type CatalogQuestion = {
  text: string;
  category: string;
  roles: string[];
  types: string[];
};

export const QUESTION_BANK: CatalogQuestion[] = [
  { text: "Walk me through your approach to designing a REST API for a student course enrollment system.", category: "REST & API design", roles: ["Java Backend", "Full Stack"], types: ["Technical", "System Design basics", "Mixed"] },
  { text: "What are the four pillars of OOPs? Give a practical example of each from a project you have built.", category: "OOPs", roles: ["Java Backend", "Full Stack"], types: ["Technical", "Mixed"] },
  { text: "Explain the difference between an INNER JOIN and a LEFT JOIN. When would you use each in a placement project?", category: "SQL & DBMS", roles: ["Java Backend", "Full Stack", "Data Analyst"], types: ["Technical", "Mixed"] },
  { text: "How would you investigate a slow SQL query in production?", category: "SQL & DBMS", roles: ["Java Backend", "Full Stack", "Data Analyst"], types: ["Technical", "System Design basics", "Mixed"] },
  { text: "What happens inside a Spring Boot application from startup to handling a request?", category: "Spring Boot", roles: ["Java Backend"], types: ["Technical", "Mixed"] },
  { text: "Explain process vs thread, and share one situation where concurrency can create a bug.", category: "Operating Systems", roles: ["Java Backend", "Full Stack"], types: ["Technical", "Mixed"] },
  { text: "What is the virtual DOM in React, and how does it affect rendering performance?", category: "React basics", roles: ["Full Stack"], types: ["Technical", "Mixed"] },
  { text: "Tell me about yourself in 60 seconds, focusing on evidence that you can succeed in this role.", category: "HR & communication", roles: ["Java Backend", "Full Stack", "Data Analyst"], types: ["HR", "Mixed"] },
  { text: "Why should we hire you for this role instead of another fresher with similar coursework?", category: "HR & communication", roles: ["Java Backend", "Full Stack", "Data Analyst"], types: ["HR", "Mixed"] },
  { text: "Are you comfortable with relocation or shifts? How would you make that decision?", category: "HR & communication", roles: ["Java Backend", "Full Stack", "Data Analyst"], types: ["HR", "Mixed"] },
  { text: "How would you turn a messy spreadsheet into a reliable weekly business report?", category: "Data thinking", roles: ["Data Analyst"], types: ["Technical", "System Design basics", "Mixed"] },
  { text: "Describe a project where you had to learn something quickly and deliver under a deadline.", category: "Behavioral", roles: ["Java Backend", "Full Stack", "Data Analyst"], types: ["HR", "Mixed"] },
];
