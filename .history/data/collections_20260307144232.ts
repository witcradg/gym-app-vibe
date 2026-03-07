export type Collection = {
  id: string;
  name: string;
  description?: string;
};

export const collections: Collection[] = [
  { id: "day-1", name: "Day 1", description: "Workout A" },
  { id: "day-2", name: "Day 2", description: "Workout B" },
  { id: "unassigned", name: "Unassigned", description: "Exercises not yet placed" },
  { id: "warmups", name: "Warmups", description: "Prep before lifting" },
  { id: "stretches", name: "Stretches", description: "Post-workout mobility" },
];

