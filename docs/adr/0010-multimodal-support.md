# 10. Multimodal Support (Image & Vision Attachments)

## Context
Enabling AI coding agent capabilities for visual input (UI mockups, error screenshots, architecture diagrams) in both CLI REPL and ACP mode.

## Decision
1. Detect image file extensions (`.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`) referenced via `@image.png` or path inputs.
2. Convert image files to base64 data URIs (`data:image/png;base64,...`).
3. Construct OpenAI `ChatCompletionContentPart` arrays supporting `type: "image_url"` payloads.
4. Support ACP `type: "image"` content blocks from Zed Editor.

## Consequences
- Harness can inspect visual bugs, design mocks, and UI components directly.
