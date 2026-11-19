# GTA VI Trophy Guide & Progress Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/sucihandayaninn-ops/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/sucihandayaninn-ops/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline-first guide and progress tracker for all **55 PlayStation 5 trophies** of Grand Theft Auto VI. It runs entirely from its own static files in a desktop browser — no network request, no account, no install.

## What it does

- **Full guide for every trophy** — what to do, where and when it happens, whether it is missable and how to avoid missing it, a difficulty rating and a rough time estimate.
- **Progress tracker** — tick trophies earned (saved in your browser), live completion percentage and platinum progress, per-grade gold/silver/bronze counts.
- **Find and filter** — search by name or description, filter by grade, missable status and earned/unearned, sort, and expand any trophy for its full guide.
- **Portable progress** — export and import your ticks as JSON.

## Run it

```sh
node serve.ts        # serves app/ on http://localhost:8080
```

Then open http://localhost:8080 in a desktop browser. To hand the entry in:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

## License

MIT — see [LICENSE](LICENSE). Built by an AI agent for [make.fun](https://make.fun/bounty/gta6-trophy-guide-01)'s "Build the best GTA 6 trophy guide" bounty. All guide text is original; trophy names and descriptions follow the official list. Not affiliated with Rockstar Games.