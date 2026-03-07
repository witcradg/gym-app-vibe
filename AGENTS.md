# Gym App Prototype Agent Instructions

This directory contains the prototype implementation for the Gym App.

The product concept and scope are defined in:

docs/gym-app-concept.md  
docs/gym-app-v1-scope.md

These documents define the intended product behavior and the v1 feature boundary.

## Development Goals

The prototype should:

- implement a mobile-first workout execution interface
- allow selecting collections
- show exercises in a collection
- support expanded exercise execution view
- allow checking sets
- support notes and plan adjustment
- allow resetting a collection
- persist state locally

## Development Constraints

This prototype must remain intentionally simple.

Do NOT introduce:

- backend services
- databases
- Supabase
- authentication
- analytics
- workout history
- session tracking
- complex architecture
- unnecessary abstraction layers

## Data Strategy

For the prototype:

- use simple local seed data
- store execution state locally (localStorage or equivalent)

## Development Style

Prefer:

- simple React components
- minimal folder structure
- readable code
- working behavior over abstraction

Add structure only when it becomes necessary.

## Implementation Order

Follow the order defined in:

docs/gym-app-v1-scope.md

Implement the prototype step-by-step rather than attempting the full system at once.

## Implementation Plan

The step-by-step implementation plan for the prototype is defined in:

docs/implementation-plan.md

When implementing features, follow the steps in this document sequentially.
Do not skip ahead or implement multiple steps at once unless instructed.

