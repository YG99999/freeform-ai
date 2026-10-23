# Contributing

Start with a focused issue or a small pull request. Favor native browser APIs and simple fixes over new services or large abstractions.

1. Fork the repository, install with `npm ci`, and use `npm run dev`.
2. Make one concrete improvement. Keep inputs, limits, errors, keyboard access, and narrow screens usable.
3. Run `npm test` and `npm run build`. Test changed user flows in an actual browser. Use `npm run check:models` when changing model URLs.
4. Describe the behavior and your validation. Do not claim hardware support you did not test.

For model additions, include a public ungated model card, clear upstream and converted-weight licensing, pinned revision, actual required file sizes, compatible runtime version, and a reproducible inference test. Do not add arbitrary executable remote model code or paid/cloud fallbacks. Document download, working-memory, cache, and cancellation behavior.

Please report bugs using the template and keep discussions respectful. Never attach private documents, audio, tokens, or account credentials to public issues.
