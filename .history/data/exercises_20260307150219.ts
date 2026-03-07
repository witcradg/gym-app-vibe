export type Exercise = {
  id: string;
  collectionId: string;
  name: string;
  order: number;
  sets: number;
  reps?: string;
  weight?: string;
  notes?: string;
};

export const exercises: Exercise[] = [
  {
    id: "bench-press",
    collectionId: "day-1",
    name: "Bench Press",
    order: 1,
    sets: 3,
    reps: "10",
    weight: "135",
    notes: "Keep elbows tucked",
  },
  {
    id: "incline-dumbbell-press",
    collectionId: "day-1",
    name: "Incline Dumbbell Press",
    order: 2,
    sets: 3,
    reps: "10",
    weight: "70",
    notes: "Control the eccentric",
  },
  {
    id: "triceps-pushdown",
    collectionId: "day-1",
    name: "Triceps Pushdown",
    order: 3,
    sets: 3,
    reps: "12",
    weight: "80",
    notes: "Keep shoulders down",
  },
  {
    id: "lat-pulldown",
    collectionId: "day-2",
    name: "Lat Pulldown",
    order: 1,
    sets: 3,
    reps: "12",
    weight: "120",
    notes: "Drive elbows down",
  },
  {
    id: "barbell-row",
    collectionId: "day-2",
    name: "Barbell Row",
    order: 2,
    sets: 3,
    reps: "8",
    weight: "145",
    notes: "Stay braced through torso",
  },
  {
    id: "face-pull",
    collectionId: "day-2",
    name: "Face Pull",
    order: 3,
    sets: 3,
    reps: "15",
    weight: "45",
    notes: "Pull to upper chest",
  },
  {
    id: "bike",
    collectionId: "warmups",
    name: "Bike",
    order: 1,
    sets: 1,
    reps: "10",
    weight: "",
    notes: "Easy pace",
  },
  {
    id: "band-pull-aparts",
    collectionId: "warmups",
    name: "Band Pull-Aparts",
    order: 2,
    sets: 2,
    reps: "15",
    weight: "",
    notes: "Keep ribs down",
  },
  {
    id: "hamstring-stretch",
    collectionId: "stretches",
    name: "Hamstring Stretch",
    order: 1,
    sets: 2,
    reps: "30",
    weight: "",
    notes: "Breathe slowly",
  },
  {
    id: "hip-flexor-stretch",
    collectionId: "stretches",
    name: "Hip Flexor Stretch",
    order: 2,
    sets: 2,
    reps: "30",
    weight: "",
    notes: "Neutral pelvis",
  },
];