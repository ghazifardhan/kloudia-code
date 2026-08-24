# Task Summary: Fix Status Bar Display in Kloudia CLI Prompt

## Task Overview
Fixed an issue where the CLI status bar (`? for shortcuts [BUILD] model · RAM · CPU`) disappeared from underneath the prompt field when waiting for user input.

## Changes Made
- Modified `src/multiline-prompt.ts`:
  - Added `model` and `mode` options to `MultilinePromptOptions`.
  - Integrated status bar rendering inside `multilinePrompt`'s `render()` method so it stays dynamically positioned directly under the input prompt line / slash command suggestions.
  - Positioned the terminal cursor back on the active input line after rendering the status bar.
- Modified `index.ts`:
  - Passed `model: modelName` and `mode: currentMode` directly into `multilinePrompt(...)`.
- Rebuilt distribution files and executable binary using `bun run build`.

## Verification
- Built binary using `bun run build` cleanly without build errors.
