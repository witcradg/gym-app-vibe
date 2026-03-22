# Chat Starter: Continue Work on Gym App Home Dashboard Direction

## Purpose

This document allows a new chat session to quickly resume design work on the **Home as Workout Dashboard** concept for the Gym App.

It summarizes the reasoning that led to this direction and provides a prompt that can be pasted into a new chat.

---

# Background Context

The Gym App originally used the root route (`/`) primarily as a navigation entry point showing collections.

Over time several design questions emerged:

• How should the app resume an in-progress workout?
• What should the Home button do?
• How should session state behave across visits?
• How should Reset Session behave?
• How might workout timing work later?
• How can the app help remember which workout day was done last?

Investigation into session persistence revealed that the app stores session progress in a durable record (`gym_app_state`).

The design direction that emerged was:

**Progress should define session identity, not navigation.**

Meaningful session progress is primarily represented by checked workout sets.

Navigation state (which screen is open) is secondary metadata and should not create a session on its own.

---

# Current Session Model

Session state persists until the user explicitly resets it.

Key rules:

• Session progress is durable.
• Navigation alone does not define a session.
• The first meaningful progress (first checked set) implicitly begins a workout session.
• Reset Session clears the durable session state and begins a new one.

---

# Emerging UX Direction

This led to a conceptual shift in how the home page should behave.

Instead of being a simple navigation entry point, the home page should function as a **Workout Dashboard**.

The home page becomes the place where users:

• Resume an in-progress workout
• Decide what workout to start next
• Reset or start a new workout

This separates two modes of the application:

Decision Mode (home dashboard)
Workout Execution Mode (active workout screens)

---

# Key Insight

Users do not typically open a workout app to browse.

They open it to answer:

"What workout should I do right now?"

The Home Dashboard should answer that question.

---

# Minimal V1 Dashboard

A minimal implementation could include:

1. Resume Workout (if progress exists)

Example:

Resume Workout
Collection: Push Day
Exercise: Incline Press
Completed Sets: 3

Button:
Resume Workout


2. Suggested Workout

Example:

Last Workout: Day 1
Suggested Next: Day 2

Buttons:
Start Day 1
Start Day 2


3. Session Controls

Reset Session
Start New Workout


---

# Future Features This Direction Supports

• Workout session timer
• Alternating workout suggestions (Day 1 / Day 2)
• Workout history
• Progress charts

These do not need to be implemented yet.

---

# Prompt For New Chat

Paste the following into a new chat to continue design work:

---

I am working on a Gym App and exploring a design direction where the home page becomes a **Workout Dashboard** instead of just a navigation entry point.

Context:

• Workout progress is stored in `gym_app_state`.
• Meaningful session identity comes from workout progress (checked sets), not navigation.
• Session state persists until the user clicks Reset Session.
• The first checked set implicitly begins a workout session.

The new idea is that the home page should become the place users go to **start or resume a workout**, acting as a workout control center.

It should help answer:

• Do I have a workout in progress?
• What did I last work on?
• What workout should I do next?

Please help explore this design direction, including:

• what a minimal V1 dashboard should contain
• how it should interact with session state
• how Reset Session should behave in this model
• how future features like workout timers and alternating workout suggestions could fit into this structure.

---

End of chat starter.
