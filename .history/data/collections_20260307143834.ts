import { exercises } from "./exercises"

export type Collection = {
  id: string
  name: string
  exerciseIds: string[]
}

export const collections: Collection[] = [

  {
    id: "day-1",
    name: "Day 1",
    exerciseIds: [
      "bench_press_machine",
      "lat_pulldown",
      "pt_shoulder_front_raise"
    ]
  },

  {
    id: "day-2",
    name: "Day 2",
    exerciseIds: [
      "lat_pulldown",
      "pt_shoulder_front_raise"
    ]
  },

  {
    id: "stretches",
    name: "Stretches",
    exerciseIds: [
      "single_arm_hold"
    ]
  },

  {
    id: "unassigned",
    name: "Unassigned",
    exerciseIds: [
      "farmers_carry"
    ]
  }

]