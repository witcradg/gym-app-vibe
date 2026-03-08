/**
 * SOURCE OF TRUTH
 *
 * This file defines the canonical Exercise model used throughout the app.
 *
 * Documentation and agents should reference this file rather than duplicating
 * the type definition in docs.
 */
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

  // ---------------------
  // Warmups
  // ---------------------

  {
    id: "band-warmup",
    collectionId: "warmups",
    name: "Band Warmup",
    order: 1,
    sets: 1,
    notes: "1 minute",
  },
  {
    id: "rotation-warmup",
    collectionId: "warmups",
    name: "Rotation Warmup",
    order: 2,
    sets: 1,
    notes: "6 minutes alternating",
  },
  {
    id: "bike",
    collectionId: "warmups",
    name: "Bike",
    order: 3,
    sets: 1,
    notes: "6 minutes optional",
  },

  // ---------------------
  // Day 1
  // ---------------------

  {
    id: "bench-press-machine",
    collectionId: "day-1",
    name: "Bench Press (Machine)",
    order: 1,
    sets: 2,
    reps: "15",
    notes: "Machine",
  },
  {
    id: "leg-press",
    collectionId: "day-1",
    name: "Leg Press",
    order: 2,
    sets: 2,
    reps: "12",
    weight: "35 lbs",
  },
  {
    id: "bench-chest-press-free-weights",
    collectionId: "day-1",
    name: "Bench Chest Press (Free Weights)",
    order: 3,
    sets: 2,
    reps: "12",
    weight: "12.5 lbs",
    notes: "Two hands independent",
  },
  {
    id: "one-arm-row",
    collectionId: "day-1",
    name: "One Arm Row",
    order: 4,
    sets: 2,
    reps: "12",
    weight: "12.5 lbs",
  },
  {
    id: "triceps-lying",
    collectionId: "day-1",
    name: "Triceps (Lying)",
    order: 5,
    sets: 2,
    reps: "12",
    weight: "12.5 lbs",
    notes: "On back",
  },
  {
    id: "pt-shoulder-front-raise-day1",
    collectionId: "day-1",
    name: "PT Shoulder – Front Raise",
    order: 6,
    sets: 2,
    reps: "12",
    weight: "5 lbs",
    notes: "Straight forward",
  },
  {
    id: "pt-shoulder-rotation",
    collectionId: "day-1",
    name: "PT Shoulder – Rotation",
    order: 7,
    sets: 2,
    reps: "12",
    weight: "3 lbs",
  },
  {
    id: "farmers-carry",
    collectionId: "day-1",
    name: "Farmer’s Carry",
    order: 8,
    sets: 1,
    weight: "15 lbs",
    notes: "Distance based",
  },
  {
    id: "leaning-pushups",
    collectionId: "day-1",
    name: "Leaning Pushups",
    order: 9,
    sets: 3,
    reps: "15",
    notes: "Bar at 11 feet back",
  },
  {
    id: "box-lift-crotch-height",
    collectionId: "day-1",
    name: "Box Lift (Crotch Height)",
    order: 10,
    sets: 2,
    reps: "10",
    notes: "Each arm",
  },
  {
    id: "box-plank",
    collectionId: "day-1",
    name: "Box Plank",
    order: 11,
    sets: 1,
    notes: "1 minute",
  },
  {
    id: "heel-to-toe-lean-box",
    collectionId: "day-1",
    name: "Heel-to-Toe Lean (Box)",
    order: 12,
    sets: 1,
    notes: "1 minute",
  },

  // ---------------------
  // Day 2
  // ---------------------

  {
    id: "lunges",
    collectionId: "day-2",
    name: "Lunges",
    order: 1,
    sets: 2,
    reps: "12",
  },
  {
    id: "slide-and-drag",
    collectionId: "day-2",
    name: "Slide & Drag",
    order: 2,
    sets: 1,
    notes: "1 minute",
  },
  {
    id: "suitcase-carry",
    collectionId: "day-2",
    name: "Suitcase Carry",
    order: 3,
    sets: 1,
    weight: "10 lbs",
    notes: "Distance based",
  },
  {
    id: "bench-press-bar",
    collectionId: "day-2",
    name: "Bench Press (Bar 25 lbs)",
    order: 4,
    sets: 2,
    reps: "12",
    weight: "25 lbs",
    notes: "Just bar",
  },
  {
    id: "seated-leg-press",
    collectionId: "day-2",
    name: "Seated Leg Press",
    order: 5,
    sets: 2,
    reps: "12",
    weight: "30 lbs",
  },
  {
    id: "face-pull",
    collectionId: "day-2",
    name: "Face Pull",
    order: 6,
    sets: 2,
    reps: "12",
    weight: "20 lbs",
    notes: "Shoulder height",
  },
  {
    id: "reverse-fly-cable",
    collectionId: "day-2",
    name: "Reverse Fly (Cable)",
    order: 7,
    sets: 2,
    reps: "12",
    weight: "5 lbs",
    notes: "Hallway machine",
  },
  {
    id: "pt-shoulder-side-raise",
    collectionId: "day-2",
    name: "PT Shoulder – Side Raise",
    order: 8,
    sets: 2,
    reps: "10",
    weight: "3 lbs",
    notes: "Don’t shrug",
  },
  {
    id: "pt-shoulder-front-raise-day2",
    collectionId: "day-2",
    name: "PT Shoulder – Front Raise",
    order: 9,
    sets: 2,
    reps: "12",
  },
  {
    id: "pt-shoulder-angle",
    collectionId: "day-2",
    name: "PT Shoulder – Angle",
    order: 10,
    sets: 2,
    reps: "12",
  },
  {
    id: "pt-shoulder-functional",
    collectionId: "day-2",
    name: "PT Shoulder – Functional",
    order: 11,
    sets: 2,
    reps: "12",
  },
  {
    id: "wall-side-plank",
    collectionId: "day-2",
    name: "Wall Side Plank",
    order: 12,
    sets: 1,
    notes: "1 minute heel to toe",
  },
  {
    id: "march-knee-to-bar",
    collectionId: "day-2",
    name: "March (Knee to Bar)",
    order: 13,
    sets: 1,
    reps: "20",
    notes: "Alternating legs",
  },
  {
    id: "lateral-band-walk",
    collectionId: "day-2",
    name: "Lateral Band Walk",
    order: 14,
    sets: 1,
    reps: "15 steps",
    notes: "Each direction green band",
  },
  {
    id: "plank-up-and-down",
    collectionId: "day-2",
    name: "Plank Up & Down",
    order: 15,
    sets: 1,
    reps: "10/side",
  },

  // ---------------------
  // Unassigned
  // ---------------------

  {
    id: "dead-bug",
    collectionId: "unassigned",
    name: "Dead Bug (Pause)",
    order: 1,
    sets: 1,
    notes: "1 minute slight pause before return",
  },
  {
    id: "side-bend-wall",
    collectionId: "unassigned",
    name: "Side Bend (Wall)",
    order: 2,
    sets: 1,
    notes: "30 second hold",
  },
  {
    id: "standing-quad-stretch",
    collectionId: "unassigned",
    name: "Standing Quad Stretch",
    order: 3,
    sets: 1,
    notes: "1 minute each leg",
  },
  {
    id: "lying-triceps-extension",
    collectionId: "unassigned",
    name: "Lying Triceps Extension",
    order: 4,
    sets: 2,
    reps: "12",
    weight: "7.5 lbs",
    notes: "Free weight",
  },
  {
    id: "seated-cable-row",
    collectionId: "unassigned",
    name: "Seated Cable Row",
    order: 5,
    sets: 2,
    reps: "15",
    weight: "30 lbs",
    notes: "Machine 39",
  },

  // ---------------------
  // Stretches
  // ---------------------

  {
    id: "hip-flexor-stretch",
    collectionId: "stretches",
    name: "Hip Flexor Stretch",
    order: 1,
    sets: 2,
    notes: "1 minute includes switches",
  },
  {
    id: "hamstring-stretch",
    collectionId: "stretches",
    name: "Hamstring Stretch",
    order: 2,
    sets: 2,
    notes: "1 minute",
  },
  {
    id: "doorway-side-stretch",
    collectionId: "stretches",
    name: "Doorway Side Stretch",
    order: 3,
    sets: 1,
    notes: "1 minute shoulder and hip forward",
  },
  {
    id: "reach-back-stretch",
    collectionId: "stretches",
    name: "Reach Back Stretch",
    order: 4,
    sets: 1,
    notes: "1 minute",
  },
];
