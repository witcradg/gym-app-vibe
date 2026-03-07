export type Collection = {
  id: string;
  name: string;
  description?: string;
};

export const collections: Collection[] = [
  { id: "day-1", name: "Day 1", description: "Push focus" },
  { id: "day-2", name: "Day 2", description: "Pull focus" },
  { id: "warmups", name: "Warmups", description: "Prep before lifting" },
  { id: "stretches", name: "Stretches", description: "Post-workout mobility" },
  { id: "rehab", name: "Rehab", description: "Joint and tendon work" },
];
