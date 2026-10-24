# Text quality check

Tested October 23, 2026 in the actual Freeform browser UI on Windows with Intel Iris Xe graphics. These are single observed generations, not a benchmark, accuracy score, or guarantee. Each prompt started a fresh chat.

## Decision

Use Qwen3.5 2B (Balanced) as the WebGPU default for chat and documents. It followed the writing constraints, solved the arithmetic, and acknowledged the missing start time in these checks. Its approximate 1.1 GB download and 2.2–2.6 GB GPU memory requirement, plus overhead, are a meaningful tradeoff. Smaller options remain available for limited hardware, with explicit limitations in the chooser.

| Model | Two-sentence note | Arithmetic (correct: $15) | Missing start time |
| --- | --- | --- | --- |
| Qwen3.5 2B | Followed constraints | Correct; emitted raw math markup | Correctly said not stated |
| Qwen3.5 0.8B | Only one sentence | Incorrect: $99 | Invented 6:00 PM |
| SmolLM2 360M, corrected prompt format | Echoed instructions | Incorrect: 27 | Invented 12:00 PM |
| SmolLM2 135M, CPU | Too long; invented plans | Incorrect: $21 | Invented 7:05 p.m. |

The CPU fallback is especially limited. Successful local inference does not imply reliable answers. Do not present the small models as equivalent to large hosted assistants. Qwen 4B/9B were not executed in this pass, so no measured ranking is claimed for them.

## Method and fixes

GPU models used the pinned catalog revisions with q4f16 weights, temperature 0.65, and a 650-token output cap. The CPU model used q8 WASM, temperature 0.65, a 420-token cap, and repetition penalty 1.1. Runtime, memory, and network differences were not controlled; no timing comparison is reported.

The application system message requests concise answers, honesty about uncertainty, and no claims of external actions. The first Qwen 2B arithmetic output exposed raw LaTeX. A plain-text arithmetic instruction was subsequently added; the samples below retain the original output, and that formatting improvement has not been separately measured here.

An investigation found that the Qwen-only WebLLM option to disable thinking inserted Qwen prompt markers into SmolLM2 too. The option now applies only to Qwen models. SmolLM2 360M was retested after that correction; the table and samples use the corrected run. Its output still failed these checks. Sampling is nondeterministic and the system-message change means this is an informal product check rather than a controlled model comparison.

## Prompts

The final document-flow check used a one-page PDF containing: "Freeform Garden Club The annual picnic is on June 12 at River Park. Bring a blanket and a reusable cup." Asked when, where, and what time, Qwen3.5 2B replied: "The annual picnic is on June 12 at River Park, but the specific start time is not stated [1]." The expandable source displayed the matching page text. This also verified PDF extraction, retrieval, streaming, and citations after the frontend changes.

### writing

```text
Write a warm thank-you note to my neighbor Sam for watering my plants. Exactly two sentences, under 45 words. Give only the note; do not invent future plans.
```

### reasoning

```text
Maya has $30. She buys 3 notebooks at $4 each and a pen for $3. How much money remains? Answer with one line of arithmetic and the amount.
```

### grounding

```text
Use only this note: The garden club picnic is on June 12 at River Park. Bring a blanket and a reusable cup. Question: When and where is the picnic, and what time does it start? If a detail is missing, say it is not stated.
```

## Observed outputs

Line-break escapes from the capture have been expanded for readability. Model wording is retained.

### Qwen3.5 2B

**writing**

```text
Thank you, Sam, for watering my plants this time!
Your kindness means a lot to me.
```

**reasoning**

```text
$30 - (3 \times $4 + $3) = $15$.
```

**grounding**

```text
Based on the note provided:

When/Where: June 12, River Park.
Time: Not stated.
What to bring: A blanket and a reusable cup.
```

### Qwen3.5 0.8B

**writing**

```text
Thank you for watering my plants; it's a small act that makes everything feel like home.
```

**reasoning**

```text
$99
```

**grounding**

```text
The garden club picnic is on June 12 at River Park, and it starts at 6:00 PM.
```

### SmolLM2 360M

**writing**

```text
"I thank Sam for watering my plants.
Just that.
Under 45 words, please.
```

**reasoning**

```text
30 - 3 = 27
```

**grounding**

```text
The garden club picnic is held on June 12 at River Park. It will start at 12:00 PM.
```

### SmolLM2 135M CPU

**writing**

```text
Dear Sam: I hope you enjoyed your day so far. Thank you for watering my plants, and I'm glad we had some time together. I should be able to come visit you soon if you're interested.

Your care of my plants is much appreciated. It means a lot to me. It's nice to have someone with different perspectives on gardening who has the experience to share their thoughts and ideas... And hopefully, more opportunities for us to meet in person!

Yours,
[Your Name]
```

**reasoning**

```text
$20 + 1 = $21.
The answer is no, that would be an over-spent wallet!
```

**grounding**

```text
The picnic started at 7:05 p.m., which is after Friday Night.
```

