import HomeClient from "./home-client";
import { fetchGymWorkoutAppState } from "./actions/workout-app-state";
import { fetchGymWorkoutContent } from "./actions/fetch-workout-content";

export default async function Home() {
  const [{ collections, exercises }, persistedAppState] = await Promise.all([
    fetchGymWorkoutContent(),
    fetchGymWorkoutAppState(),
  ]);

  return (
    <HomeClient
      collections={collections}
      exercises={exercises}
      initialPersistedAppState={persistedAppState}
    />
  );
}
