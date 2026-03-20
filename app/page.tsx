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
  console.log("[AUTH DEBUG] / page render started");
  const supabase = await createClient();
  const params = searchParams ? await searchParams : undefined;
  const sessionResult = await supabase.auth.getSession();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("[AUTH DEBUG] / page session:", sessionResult.data.session);
  console.log("[AUTH DEBUG] / page user:", user ? user.email : null);

  if (!user) {
    const initialMessage = params?.authError
      ? "We couldn't complete sign-in. Please try again."
      : undefined;

    console.log("[AUTH DEBUG] / rendering login UI");
    return <LoginForm initialMessage={initialMessage} />;
  }

  console.log("[AUTH DEBUG] / rendering authenticated app for:", user.email);
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
