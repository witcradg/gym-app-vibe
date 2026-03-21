
What I would do next is not ask Codex for more changes yet. First test this version hard.

Use this test sequence:

Start a workout, check some sets, move to another exercise, refresh the page.

Start a workout, check some sets, close the tab entirely, reopen the app.

Start a workout, wait a moment after changes, close and reopen.

Start a workout, make changes, immediately close the tab to test the keepalive flush path.

Edit sets/reps/weight/notes, refresh, and confirm those come from exercise records rather than session state.

Verify a signed-in user gets one resumable workout, not ambiguous restore behavior.

What I would inspect in the code before testing:

data/exerciseState.ts to confirm no content overlay remains

components/home/home-client.tsx to confirm rehydrate only runs when resumable state is truly missing

the API/action route to confirm write/read shape matches the new payload

tests to see whether they cover abrupt exit and legacy payload normalization

Two things I would still watch closely:

First, the heuristic for “missing resumable state” may still be the weak point. If restore fires when it should not, or fails to fire when it should, that will show up quickly in testing.

Second, pagehide / visibilitychange flushes are best-effort, not magic. They improve reliability, but they do not guarantee zero-loss in every browser timing edge case. So if you still see occasional misses, that would not necessarily mean the architecture is wrong; it might mean save timing needs another pass.

My practical judgment:
this is ready for field testing.
