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
