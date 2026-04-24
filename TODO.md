# NextFlow Project — Implementation Tracker

## Phase A — Critical UI/UX Fixes ✅
- [x] A1. Fix MiniMap position to bottom-right (`workflow-canvas.tsx`)
- [x] A2. Implement pulsating glow for running nodes (`base-node.tsx` + `globals.css`)
- [x] A3. Default history panel to open (`ui-slice.ts`)

## Phase B — Feature Completeness ✅
- [x] B1. Add "%" support to Extract Frame node (`extract-frame-node.tsx` + `extract-frame-task.ts`)
  - [x] Node UI: toggle between Seconds / Percentage
  - [x] Task: ffprobe video duration, convert percentage to seconds
  - [x] Update seed template to use `timestampMode: 'percentage'`
  - [x] Update node-registry defaultConfig
- [x] B2. Validate imported workflow JSON with Zod (`workflow-toolbar.tsx`)
- [x] B3. Pre-execution DAG validation in orchestrator (`orchestrator.ts`)

## Phase C — UX & Feedback ✅
- [x] C1. Execution completion alerts (`execution-slice.ts`)
  - [x] Success alert on completion
  - [x] Failure alert with node-level errors
  - [x] Timeout alert
- [x] C2. Node context menu (`workflow-canvas.tsx`)
  - [x] Right-click on node shows menu
  - [x] Actions: Run Single, Run Partial, Delete Node

## Phase D — Code Quality ✅
- [x] D1. Fix LLM model aliases — show real model names (`llm-node.tsx` + `llm-task.ts`)
- [x] D2. Runtime environment variable validation (`lib/env.ts`)
- [x] D3. Robust edge type validation using NODE_REGISTRY (`workflow-slice.ts`)

## Phase E — Backend & APIs ✅
- [x] E1. Add cancellation endpoint (`/api/executions/[id]/cancel`)
- [x] E2. Add cancel API client method

## Final Verification
- [x] All 6 node types functional with Trigger.dev tasks
- [x] All files compile without errors
- [x] Sample workflow template seeded correctly

