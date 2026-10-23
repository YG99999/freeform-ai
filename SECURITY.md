# Security

For a vulnerability, use [GitHub's private reporting form](https://github.com/YG99999/freeform-ai/security/advisories/new). Do not publish exploit payloads containing personal data, credentials, or private files. If private reporting is unavailable on a fork, open an issue asking for a private contact without disclosing exploit details.

The current release is the supported version. Dependency updates and browser/runtime security fixes should be applied promptly.

The app accepts bounded local files, uses PDF.js with JavaScript evaluation disabled, extracts only raw DOCX text, checks DOCX expansion metadata, sanitizes generated Markdown, and forbids model-generated outbound content. Browser inference and model weights are still complex third-party software; do not assume local execution makes arbitrary models or documents trustworthy.
