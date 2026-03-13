# Gym App Admin UI Design Brief

## Tech Stack

- Framework: Next.js 16.1.6
- Routing: App Router
- Language: TypeScript
- Styling: plain CSS via [`app/globals.css`](/home/dean/projects/active/personal/gym/gym-app-vibe/app/globals.css)
- Data store: Supabase Postgres via `@supabase/supabase-js`
- Backend access style:
  - server-side repository functions in [`lib/supabase/workout-content.ts`](/home/dean/projects/active/personal/gym/gym-app-vibe/lib/supabase/workout-content.ts)
  - server actions in [`app/actions/fetch-workout-content.ts`](/home/dean/projects/active/personal/gym/gym-app-vibe/app/actions/fetch-workout-content.ts) and [`app/actions/upsert-workout-content.ts`](/home/dean/projects/active/personal/gym/gym-app-vibe/app/actions/upsert-workout-content.ts)
  - JSON API routes under [`app/api/collections`](/home/dean/projects/active/personal/gym/gym-app-vibe/app/api/collections) and [`app/api/exercises`](/home/dean/projects/active/personal/gym/gym-app-vibe/app/api/exercises)
- Testing: Vitest
- UI libraries not present:
  - no Tailwind
  - no shadcn/ui
  - no React Hook Form
  - no Zod
  - no table/grid library

Notes:
- The current repo does not define a separate `categories` table/entity. The closest equivalent is `collections`.
- The phone UI already consumes `collections` and `exercises` from Supabase in [`app/page.tsx`](/home/dean/projects/active/personal/gym/gym-app-vibe/app/page.tsx).

## Entities

### Terminology

For admin UI purposes:

- `categories` in the request maps to the existing `collections` entity in the codebase and database
- `exercises` is a separate entity related to `collections`

There is no standalone `categories` schema or table in the repository.

### ENTITY: collections

Source of truth:
- SQL: [`supabase/migrations/20260312221000_create_workout_content.sql`](/home/dean/projects/active/personal/gym/gym-app-vibe/supabase/migrations/20260312221000_create_workout_content.sql)
- TS type: [`types/collection.ts`](/home/dean/projects/active/personal/gym/gym-app-vibe/types/collection.ts)
- DB row mapping: [`lib/supabase/workout-content.ts`](/home/dean/projects/active/personal/gym/gym-app-vibe/lib/supabase/workout-content.ts)

Fields:
- `id` (`text`, required, primary key)
  - no default
  - supplied by application/client
- `name` (`text`, required)
  - no default
- `description` (`text`, nullable)
  - no default

Constraints:
- primary key on `id`
- no unique constraint on `name`
- no created/updated timestamps

Relationships:
- one-to-many: `collections.id -> exercises.collection_id`
- delete cascade from `collections` to `exercises`

### ENTITY: exercises

Source of truth:
- SQL: [`supabase/migrations/20260312221000_create_workout_content.sql`](/home/dean/projects/active/personal/gym/gym-app-vibe/supabase/migrations/20260312221000_create_workout_content.sql)
- TS type: [`types/exercise.ts`](/home/dean/projects/active/personal/gym/gym-app-vibe/types/exercise.ts)
- DB row mapping: [`lib/supabase/workout-content.ts`](/home/dean/projects/active/personal/gym/gym-app-vibe/lib/supabase/workout-content.ts)

Fields:
- `id` (`text`, required, primary key)
  - no default
  - supplied by application/client
- `collection_id` (`text`, required, foreign key)
  - references `collections.id`
- `name` (`text`, required)
  - no default
- `order_index` (`integer`, required)
  - no SQL default
- `sets` (`integer`, required)
  - no SQL default
  - check constraint: `sets >= 1`
- `reps` (`text`, nullable)
- `weight` (`text`, nullable)
- `notes` (`text`, nullable)

Constraints:
- primary key on `id`
- foreign key `collection_id references collections(id) on delete cascade`
- check constraint on `sets >= 1`
- index on `(collection_id, order_index)`
- no unique constraint on `name`
- no unique constraint on `(collection_id, order_index)`

Relationships:
- many-to-one: `exercises.collection_id -> collections.id`
- inverse one-to-many: one collection has many exercises

### ENTITY: gym_app_state

This is not part of the requested admin content UI, but it exists in the database and is used by the phone UI runtime.

Source:
- SQL: [`supabase/migrations/20260313100000_create_app_state.sql`](/home/dean/projects/active/personal/gym/gym-app-vibe/supabase/migrations/20260313100000_create_app_state.sql)

Fields:
- `id` (`text`, required, primary key)
- `state` (`jsonb`, required)
- `updated_at` (`timestamptz`, required, default `timezone('utc', now())`)

Current usage:
- single logical row id: `gym-app-state`
- stores phone workout execution state, not catalog/admin content

## CRUD Behavior

### COLLECTION CRUD

#### Read/List

Repository:
- `fetchCollections()` in [`lib/supabase/workout-content.ts`](/home/dean/projects/active/personal/gym/gym-app-vibe/lib/supabase/workout-content.ts)
- `fetchCollectionById(id)` in [`lib/supabase/workout-content.ts`](/home/dean/projects/active/personal/gym/gym-app-vibe/lib/supabase/workout-content.ts)

API routes:
- `GET /api/collections` in [`app/api/collections/route.ts`](/home/dean/projects/active/personal/gym/gym-app-vibe/app/api/collections/route.ts)
- `GET /api/collections/[id]` in [`app/api/collections/[id]/route.ts`](/home/dean/projects/active/personal/gym/gym-app-vibe/app/api/collections/[id]/route.ts)

Behavior:
- list sorted by `name ASC`
- no filtering
- single fetch returns `404` if not found

#### Create

Repository:
- `upsertCollection(collection)` in [`lib/supabase/workout-content.ts`](/home/dean/projects/active/personal/gym/gym-app-vibe/lib/supabase/workout-content.ts)

API route:
- `POST /api/collections` in [`app/api/collections/route.ts`](/home/dean/projects/active/personal/gym/gym-app-vibe/app/api/collections/route.ts)

Validation rules:
- body must be an object
- `id` required, must be non-empty string after trim
- `name` required, must be non-empty string after trim
- `description` optional
- blank `description` is normalized to `undefined`

Behavior:
- implemented as upsert on `id`, not strict insert-only create
- returns `201` on success
- returns `500` on repository/database failure

#### Update

Repository:
- same `upsertCollection(collection)`

API route:
- `PATCH /api/collections/[id]` in [`app/api/collections/[id]/route.ts`](/home/dean/projects/active/personal/gym/gym-app-vibe/app/api/collections/[id]/route.ts)

Editable fields:
- `name`
- `description`

Validation/merge behavior:
- existing record must exist first or `404`
- body must be an object
- `name`:
  - if provided and non-empty string after trim, use it
  - if absent or invalid, existing `name` is retained
- `description`:
  - `null` clears description to `undefined`
  - string is trimmed; blank string becomes `undefined`
  - absent/invalid keeps existing value

#### Delete

Repository:
- `deleteCollection(id)` in [`lib/supabase/workout-content.ts`](/home/dean/projects/active/personal/gym/gym-app-vibe/lib/supabase/workout-content.ts)

API route:
- `DELETE /api/collections/[id]` in [`app/api/collections/[id]/route.ts`](/home/dean/projects/active/personal/gym/gym-app-vibe/app/api/collections/[id]/route.ts)

Behavior:
- hard delete
- no soft delete
- no explicit precheck for existence
- due to SQL foreign key, deleting a collection cascades and deletes child exercises

### EXERCISE CRUD

#### Read/List

Repository:
- `fetchExercises()` in [`lib/supabase/workout-content.ts`](/home/dean/projects/active/personal/gym/gym-app-vibe/lib/supabase/workout-content.ts)
- `fetchExerciseById(id)` in [`lib/supabase/workout-content.ts`](/home/dean/projects/active/personal/gym/gym-app-vibe/lib/supabase/workout-content.ts)

API routes:
- `GET /api/exercises` in [`app/api/exercises/route.ts`](/home/dean/projects/active/personal/gym/gym-app-vibe/app/api/exercises/route.ts)
- `GET /api/exercises/[id]` in [`app/api/exercises/[id]/route.ts`](/home/dean/projects/active/personal/gym/gym-app-vibe/app/api/exercises/[id]/route.ts)

Behavior:
- list sorted by:
  - `collection_id ASC`
  - `order_index ASC`
- no filtering
- single fetch returns `404` if not found

#### Create

Repository:
- `upsertExercise(exercise)` in [`lib/supabase/workout-content.ts`](/home/dean/projects/active/personal/gym/gym-app-vibe/lib/supabase/workout-content.ts)

API route:
- `POST /api/exercises` in [`app/api/exercises/route.ts`](/home/dean/projects/active/personal/gym/gym-app-vibe/app/api/exercises/route.ts)

Validation rules:
- body must be an object
- `id` required, trimmed non-empty string
- `collectionId` required, trimmed non-empty string
- `name` required, trimmed non-empty string
- `order` required, positive integer
- `sets` required, positive integer
- `reps`, `weight`, `notes` optional strings
- blank optional strings normalize to `undefined`

Behavior:
- implemented as upsert on `id`, not strict insert-only create
- database still enforces valid `collection_id` foreign key
- returns `201` on success

#### Update

Repository:
- same `upsertExercise(exercise)`

API route:
- `PATCH /api/exercises/[id]` in [`app/api/exercises/[id]/route.ts`](/home/dean/projects/active/personal/gym/gym-app-vibe/app/api/exercises/[id]/route.ts)

Editable fields:
- `collectionId`
- `name`
- `order`
- `sets`
- `reps`
- `weight`
- `notes`

Validation/merge behavior:
- existing record must exist first or `404`
- body must be an object
- `collectionId`: if missing/invalid, keep existing
- `name`: if missing/invalid, keep existing
- `order`: if missing/invalid, keep existing
- `sets`: if missing/invalid, keep existing
- `reps`, `weight`, `notes`:
  - `null` clears field to `undefined`
  - string is trimmed; blank string becomes `undefined`
  - absent/invalid keeps existing

#### Delete

Repository:
- `deleteExercise(id)` in [`lib/supabase/workout-content.ts`](/home/dean/projects/active/personal/gym/gym-app-vibe/lib/supabase/workout-content.ts)

API route:
- `DELETE /api/exercises/[id]` in [`app/api/exercises/[id]/route.ts`](/home/dean/projects/active/personal/gym/gym-app-vibe/app/api/exercises/[id]/route.ts)

Behavior:
- hard delete
- no soft delete
- no explicit precheck for existence

## Business Rules

Explicitly enforced in code or SQL:

- There is no separate `categories` entity; use `collections` as the category-like grouping model.
- Every exercise must belong to a collection.
  - enforced by required `collection_id`
  - enforced by foreign key to `collections.id`
- Deleting a collection deletes its exercises.
  - enforced by `on delete cascade`
- `sets` must be at least `1`.
  - enforced in SQL
  - mirrored in API validation with positive integer parsing
- `order` / `order_index` must be a positive integer at the API layer for create/update payloads.
- Collection `id` and exercise `id` are application-supplied strings, not database-generated ids.
- Collection names are required but not unique.
- Exercise names are required but not unique.
- Exercise ordering is stored in `order_index`, but uniqueness per collection is not enforced.
- Create endpoints are actually id-based upserts.
  - posting an existing `id` overwrites that row rather than failing uniqueness
- Update routes are patch-style merge operations.
- Optional text fields (`description`, `reps`, `weight`, `notes`) normalize blank strings to missing values.
- `null` in PATCH routes explicitly clears optional text fields.
- No auth or role gating is implemented for admin-style CRUD.

Implicit product/domain signals from docs:

- Desktop admin is intended to manage collections and exercises for the same user who uses the phone UI.
- Exercises should be movable between collections.
- Reordering exercises inside a collection is expected by the product docs, but there is no special reorder API yet beyond updating `order`.

## Test Expectations

### Content Read Test

File:
- [`lib/supabase/workout-content.integration.test.ts`](/home/dean/projects/active/personal/gym/gym-app-vibe/lib/supabase/workout-content.integration.test.ts)

Expected behavior:
- both `collections` and `exercises` tables are readable from Supabase
- count query succeeds for both tables
- counts are `>= 0`

### Content CRUD Test

File:
- [`lib/supabase/workout-content-crud.integration.test.ts`](/home/dean/projects/active/personal/gym/gym-app-vibe/lib/supabase/workout-content-crud.integration.test.ts)

Expected behavior:
- create collection by upsert
- read created collection by id
- update collection by upsert
- create exercise by upsert
- read created exercise by id
- update exercise by upsert
- delete exercise
- delete collection
- after deletion, fetch-by-id returns `null`

Cleanup expectations:
- test uses dedicated IDs:
  - `integration-test-collection`
  - `integration-test-exercise`
- if rows already existed under those IDs, original rows are restored in `afterAll`
- if rows did not exist, they are removed in `afterAll`
- test is intended not to leave `collections` or `exercises` changed when complete

### Workout App State Test

File:
- [`lib/supabase/workout-app-state.integration.test.ts`](/home/dean/projects/active/personal/gym/gym-app-vibe/lib/supabase/workout-app-state.integration.test.ts)

Relevance:
- not part of admin catalog CRUD, but confirms Supabase round-trip write/read/restore behavior for the phone-side persisted state table

### Unit Tests

File:
- [`data/exerciseState.test.ts`](/home/dean/projects/active/personal/gym/gym-app-vibe/data/exerciseState.test.ts)

Expected behavior for phone runtime state:
- reps and weight remain string-capable
- older numeric persisted values are converted to strings
- navigation restore is clamped/safe
- invalid saved collection falls back to collection list
- completion state derives from set-check booleans

These tests are not admin CRUD tests, but they describe data expectations the admin UI should not violate.

## Suggested UI Actions

These are not visual designs. They are action-level recommendations inferred from the implemented backend and docs.

### Collection Management

- List all collections, sorted alphabetically by current backend behavior.
- Create collection:
  - fields: `id`, `name`, `description`
  - because `id` is required today, the UI will need either:
    - an explicit editable slug/id field, or
    - client-generated ids before submit
- Edit collection:
  - `name`
  - `description`
- Delete collection:
  - warn that deleting a collection also deletes all exercises in it
- View collection details along with its exercises

### Exercise Management

- List all exercises
- Filter/group by collection in the UI even though the current API does not support server filtering
- Create exercise:
  - fields: `id`, `collectionId`, `name`, `order`, `sets`, `reps`, `weight`, `notes`
- Edit exercise:
  - all of the above except `id` if the UI treats ids as immutable
- Delete exercise
- Move exercise between collections by changing `collectionId`
- Reorder exercises within a collection by editing `order`

### UX Implications For The Designer

- The backend is simple and field-oriented; the UI should be similarly simple.
- There is no auth boundary, so admin UI does not need permission flows.
- The API is not currently optimized for bulk edit/reorder operations.
- Because create routes use upsert, the UI should avoid accidental id collisions.
- Because `order` is manual and not uniqueness-enforced, the UI should help prevent confusing duplicate order values within a collection.

