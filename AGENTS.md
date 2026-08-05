# JP Match UI Design Constitution

This file defines the non-negotiable product, visual, interaction, and validation rules for JP Match.

## Required workflow

Before implementing a major UI change:

1. Read `README.md` and every file under `docs/`.
2. Inspect the current build at both wide and narrow viewports.
3. Inspect the card data, audio behavior, and available visual assets.
4. Use the `game-ui-art-director` workflow and present at least four substantially different directions.
5. Do not implement a direction until the user selects it.
6. After implementation, launch the game through HTTP and capture the required states.
7. Use `game-ui-visual-critic` against the rendered screenshots.
8. Complete at least two visual revision cycles. Do not finish with unresolved severity-1 or severity-2 issues.

## Product identity

JP Match is:

- a touch-first Japanese-learning memory game for phones and tablets;
- a solo practice tool and a face-to-face two-player game;
- a game about connecting two representations of the same sound or meaning;
- fast, legible, encouraging, and suitable for beginners;
- driven by reveal, listening, recognition, recall, matching, and turn-taking.

JP Match is not:

- a generic mobile RPG or casino card game;
- a SaaS settings dashboard;
- a collection of interchangeable rounded controls;
- a generic “Japanese” skin made from red suns, gold frames, torii, or random brush marks;
- an effects showcase that delays card play.

## Mechanic contract

- A turn reveals at most two cards.
- A match requires the same pair key on two different representation sides.
- A successful pair belongs to the current player and lets that player continue.
- A mismatch remains visible briefly, then changes the active player in two-player mode.
- Card pronunciation is instructional feedback, not decoration.
- The remaining-pair count, current player, both scores, card state, and mode must stay unambiguous.
- Important states must differ by shape, position, text, or motion as well as color.
- Existing content modes, grid sizes, vocabulary categories, local audio fallbacks, and reduced-motion support must not regress during a visual redesign.

## Signature principle

The selected interface must express the act of connecting two representations. A cropped gameplay screenshot without the logo should still be identifiable as JP Match.

Current signature status:

- Pending user selection from the directions in `docs/art-direction.md`.

## Non-negotiable visual principles

- The board is the primary gameplay focal point.
- The two representation sides of a pair must be related but visibly distinct.
- Two-player ownership must read from both sides of the screen without relying on color alone.
- Successful matches must leave meaningful progression feedback; unexplained empty holes are not sufficient.
- Decoration must express learning content, pair structure, turn ownership, game state, or interaction.
- Typography is part of the learning interface. Kana, romaji, numbers, and Traditional Chinese labels require deliberate roles.
- Prefer fewer strong gestures over many equally polished surfaces.
- At least one important screen element should deliberately break a uniform grid.
- Touch targets must remain at least 44 CSS pixels where the board density permits; dense boards need an equivalent accessible strategy.

## Forbidden defaults

Avoid unless the selected direction explicitly justifies them:

- uniform rounded cards and pill controls;
- decorative glassmorphism;
- purple-blue AI gradients;
- glow used as the main hierarchy mechanism;
- particles unrelated to a match, turn, or learning event;
- a centered modal for every event;
- a header followed by a grid of equal settings cards;
- identical circular icon containers;
- stock emoji mixed with custom illustrations without a system;
- generic Japanese genre shorthand;
- animation on every element;
- color-only player, success, failure, or selection states.

## Responsive contract

Validate at minimum:

- `1280x720` desktop/landscape;
- `768x1024` tablet portrait;
- `390x844` phone portrait;
- `390x667` short phone portrait.

Responsive layouts may change composition rather than merely shrink. Preserve readable card contents, visible turn ownership, and reachable controls at every supported size.

## Visual validation states

Capture stable screenshots for:

- setup: kana mode and word mode;
- gameplay: face-down board;
- one card revealed;
- successful match;
- mismatch and switched turn;
- solo and two-player HUDs;
- menu overlay;
- result: win and tie where practical;
- smallest and largest supported viewports;
- at least one reduced-motion check.

Keep filenames stable under `visual-tests/` so iterations can be compared.
