# JP Match UI Rules

## Hierarchy

- The current learning decision is the focal point: setup choice before play, card board during play, result after completion.
- Primary, secondary, and tertiary information must differ structurally, not only through color or font size.
- Score, active player, remaining pairs, and revealed cards must be legible at a glance.
- Secondary settings must not compete with the start action or gameplay board.

## Cards and pair states

- Romaji, hiragana, katakana, pictures, and symbols need distinct but related treatments.
- Face-down, revealed, matched, pending mismatch, disabled, and focused states must be defined.
- A successful pair must create persistent progress feedback instead of only disappearing.
- Focus indicators may not be clipped by dense board layouts.
- Card decoration must explain representation side, state, ownership, or the selected metaphor.

## Two-player behavior

- Player 1 and Player 2 must differ by spatial ownership plus at least one non-color cue.
- Turn switching should be noticeable without blocking the next input.
- Scores need equal readability, but the active player must have stronger visual weight.
- Do not assume both players view the screen from the same physical orientation.

## Typography and learning content

- Kana remains the most visually authoritative learning form.
- Romaji must be readable but should not visually overpower kana.
- Traditional Chinese labels explain context; they are not decoration.
- Numeric scores and remaining counts use stable-width treatment where movement could distract.
- Long vocabulary and calendar strings must be tested on the smallest cards.

## Audio and motion

- Pronunciation, flip, match, mismatch, and turn feedback require distinct roles.
- Choose one dominant motion verb and no more than two supporting verbs after direction selection.
- Input responsiveness takes priority over dramatic animation.
- Every meaningful animation requires a reduced-motion equivalent.
- Critical state information must not rely on sound or motion alone.

## Responsive behavior

- Phone portrait may transpose or recombine the board; it must not simply shrink desktop UI.
- Preserve usable touch targets and learning-text legibility before ornamental detail.
- Mode labels may collapse only when the mode remains discoverable elsewhere.
- Setup must fit short phone heights without hiding the start action.
- Test 1280×720, 768×1024, 390×844, and 390×667.

## Visual regression

Use stable filenames and compare the states listed in `visual-tests/README.md`. Review hierarchy, clipping, alignment, text rendering, asset consistency, representation-side clarity, turn ownership, state differences, and the selected signature element.
