import { fetchGymWorkoutAppState } from "./actions/workout-app-state";
import { fetchGymWorkoutContent } from "./actions/fetch-workout-content";
import HomeClient from "@/components/home/home-client";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "./login/login-form";

type HomePageProps = {
  searchParams?: Promise<{
    authError?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const supabase = await createClient();
  const params = searchParams ? await searchParams : undefined;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const initialMessage = params?.authError
      ? "We couldn't complete sign-in. Please try again."
      : undefined;

    return <LoginForm initialMessage={initialMessage} />;
  }

  const [{ collections, exercises }, initialPersistedAppState] = await Promise.all([
    fetchGymWorkoutContent(),
    fetchGymWorkoutAppState(),
  ]);

  return (
    <HomeClient
      collections={collections}
      exercises={exercises}
      initialPersistedAppState={initialPersistedAppState}
    />
  );
}
