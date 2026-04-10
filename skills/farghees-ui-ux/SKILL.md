---
name: farghees-ui-ux
description: Farghees UI/UX safe local design assistant for web and mobile implementation. Use for interface planning, component design, UX reviews, accessibility checks, typography and color recommendations, responsive layout guidance, and stack-specific UI patterns. This version avoids system/package install instructions and focuses only on local design guidance.
---

# UI/UX Pro Max (Safe)

Use this skill for UI/UX work only.

## What this skill does
- Recommend design directions (style, color, typography, layout)
- Provide UX and accessibility checks
- Suggest component and page structure
- Return stack-specific UI implementation guidance from local CSV knowledge

## Safety boundaries
- Do **not** run OS/package management commands from this skill
- Do **not** use sudo/elevated commands for this skill
- Keep outputs focused on design and front-end implementation

## Usage

### 1) Generate a design system
```bash
python3 skills/farghees-ui-ux/scripts/search.py "<product keywords>" --design-system
```

### 2) Search a specific domain
```bash
python3 skills/farghees-ui-ux/scripts/search.py "<query>" --domain <domain>
```

Available domains:
- style
- color
- typography
- product
- landing
- chart
- ux
- google-fonts
- react
- web

### 3) Stack-specific guidance
```bash
python3 skills/farghees-ui-ux/scripts/search.py "<query>" --stack <stack>
```

Common stacks:
- react
- nextjs
- vue
- svelte
- react-native
- flutter
- shadcn
- html-tailwind

## Output expectations
- Prefer concise, actionable recommendations
- Include accessibility and responsive checks
- Prioritize consistency of spacing, typography, color semantics, and interaction states
- For implementation requests, provide code-oriented suggestions aligned with selected stack
