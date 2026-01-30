# Data Directory

This directory contains private data files that are **not committed to git**.

## Contents

- `prompts/` - AI prompts for findings-to-best-practices association
  - `static-prompt.txt` - Static part of the prompt (best practices template)
  - `dynamic-prompt.txt` - Dynamic part of the prompt (findings template)

- `mappings/` - Custom mappings for findings association
  - `scan-findings-to-best-practices-mapping.json` - Manual mapping of Prowler event codes to best practices

## Setup

Create the directories and add your files:

```bash
mkdir -p data/prompts data/mappings
```

Then create your files:
- `data/prompts/static-prompt.txt` - Must include `{{bestPractices}}`
- `data/prompts/dynamic-prompt.txt` - Must include `{{findings}}`
- `data/mappings/scan-findings-to-best-practices-mapping.json` - Optional custom mapping

See [Backend README](../apps/backend/README.md#configure-ai-prompts) for detailed instructions.

## Note

All files in this directory (except `.gitkeep` and this README) are ignored by git to keep your data private.
