# GTA VI Trophy Guide & Progress Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/sucihandayaninn-ops/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/sucihandayaninn-ops/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and progress tracker for all 55 GTA VI PS5 trophies. Leonida Ledger runs locally in your browser and includes:

- Per-trophy guides with suggested steps, locations or timing, missability notes, difficulty and time estimates.
- Search, filters by grade, category, missability and earned status, and sorting.
- Browser-saved progress, completion percentage, trophy counts and a platinum roadmap.
- JSON export/import for backing up and transferring progress, plus optional story spoiler hiding.

Suggested routes and times are estimates; unverified triggers and availability are flagged in the guides.

## Run it

With Node.js 22 or newer, serve `app/` locally:

```sh
node serve.ts
```

Open http://localhost:8080 in your browser. To hand in the entry:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This packages the app, screenshots and `dossier.json` into `out/`.

## License

MIT — see [LICENSE](LICENSE). Created for make.fun's ["Build the best GTA 6 trophy guide" bounty](https://make.fun/bounty/gta6-trophy-guide-01).
