# Freeform frontend refinement

## Design plan

Freeform is a personal toolbox for people who want to write, create, or work with a file without understanding AI infrastructure. The first screen should invite an action, then become a comfortable working space.

- Palette: paper #ffffff, lavender #f5f4fa, ink #252333, iris #6150d6, lemon #f5dc68, sage #dff0e8.
- Type: Bricolage Grotesque for the wordmark and welcoming headings; DM Sans for navigation, controls, and readable output. Body/control text is 14–16px, with comfortable line heights and readable line lengths.
- Layout: left-aligned tool rail, one working canvas, and a compact model chooser in the workspace header. The empty chat is a centered invitation; conversations and file workflows align left. Phone navigation uses a compact native tool selector so the action stays near the top.

```text
freeform                              downloads / help / device
Write & chat  | Write & chat       [Quick & light / model v]
Documents     |       star + short invitation (empty only)
Make an image |       examples / conversation / file result
Transcribe    |
Read aloud    |       file input (when required)
Cutout        |       message / task input        [action]
Privacy/source|       local processing + session note
```

## Brief review before implementation

The original centered hero and permanent three-tier model panel looked welcoming as a mockup, but used too much room in a working app. A generic dashboard of tool cards would repeat this problem. Keep the star as the sole expressive visual, use a quiet navigation rail rather than a card grid, and put the user's input and result first. Remove repeated privacy claims, redundant model selection, poetic action labels, and layered CSS overrides. Keep model download/memory facts available in the chooser and confirmation, where they help a decision.

## Interaction priorities

- Familiar chat: Enter sends, Shift+Enter adds a line, auto-growing composer, readable messages, and scrolling that does not pull someone away from an earlier reply.
- File tools: clear choose/drop target, selected file state, portrait preview, task-specific options, and visible results with save actions.
- Models: one chooser, clear current/recommended choices, download/memory information, and accurate session-ready feedback. No claim that an incompletely cached model is installed.
- Preserve each tool's draft and options when switching, with useful focus and hash navigation.
- Explicit first-download confirmation, visible progress/Stop, recoverable errors, keyboard-accessible dialogs, 44px touch targets, and reduced motion.
- Responsive app structure with a compact phone tool selector; no horizontal page overflow or tiny side-panel controls.

The original mockup remains in `design/`. The new pass replaces the mockup-era styles rather than layering another override sheet on top.

## Visual critique and refinement

Desktop screenshots confirmed that the quiet rail and single canvas leave room for actual messages. The star is limited to the empty chat; it disappears once work starts. The phone view uses a native tool selector instead of wrapping six navigation buttons. At 350px the complete empty chat, input, and action fit on screen without horizontal scrolling.

A second copy pass removed the tagline, repeated capability/privacy cards, the permanent model panel, and redundant file-task introductions after choosing a file. Download and memory facts remain in the model chooser and confirmation. Secondary text contrast was increased after screenshot review. Short viewports reduce the empty welcome so the composer has priority.

Interaction checks cover a real streamed answer, cancelled download with draft retained, PDF reading, per-tool drafts/options, and real audio transcription with result actions. Text quality is evaluated separately from visual polish; see docs/TEXT-QUALITY.md.
