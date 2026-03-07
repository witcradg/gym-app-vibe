export type Exercise = {
  id: string
  name: string
  sets?: string
  reps?: string
  weight?: string
  minutes?: string
  notes?: string
}

export const exercises: Record<string, Exercise> = {

  bench_press_machine: {
    id: "bench_press_machine",
    name: "Bench Press (Machine)",
    sets: "3",
    reps: "12",
    weight: "35 lbs",
    notes: "Machine"
  },

  lat_pulldown: {
    id: "lat_pulldown",
    name: "Lat Pulldown",
    sets: "3",
    reps: "12",
    weight: "65 lbs"
  },

  pt_shoulder_front_raise: {
    id: "pt_shoulder_front_raise",
    name: "PT Shoulder – Front Raise",
    sets: "3",
    reps: "12",
    weight: "12.5 lbs",
    notes: "Each arm"
  },

  farmers_carry: {
    id: "farmers_carry",
    name: "Farmer's Carry",
    sets: "3",
    reps: "15 steps",
    weight: "50 lbs",
    notes: "Distance-based"
  },

  single_arm_hold: {
    id: "single_arm_hold",
    name: "Single Arm Hold",
    sets: "2",
    minutes: "0.5",
    weight: "25 lbs",
    notes: "Each arm"
  }

}