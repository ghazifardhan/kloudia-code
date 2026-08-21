# 6. Semantic Versioning (SemVer) Enforcement

## Context
Enforcing strict versioning standards (`MAJOR.MINOR.PATCH`) for NPM distribution and CLI releases.

## Decision
1. Follow SemVer strict specification for all public releases of `kloudia-code`.
2. `PATCH` increment for bug fixes & UI styling.
3. `MINOR` increment for new features (e.g., new tools, skills, or settings options).
4. `MAJOR` increment for breaking API/CLI changes.
5. Provide automated npm release helper scripts in `package.json`.

## Consequences
- Predictable release lifecycle for users installing via NPM.
