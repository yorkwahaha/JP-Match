# JP Match Visual Review — ことば結び

Review basis:

- rendered local HTTP build;
- setup, kana gameplay, word-image gameplay, match, mismatch, player switch, menu, and result states;
- `1280x720`, `768x1024`, `390x844`, and `390x667` checks;
- before/after comparison against the original rounded-card night theme.

## Iteration 1 review

### Three most damaging weaknesses

1. The first implementation used a dense engineering grid and low-contrast metadata, making setup feel more technical than educational.
2. Repeated circular crosshairs on every card resembled a generic HUD and contradicted the tag-and-cord metaphor.
3. Same-row matches produced nearly straight cords across the board, and Player 1 knot markers lost their intended diamond silhouette.

### Deleted rather than polished

- circular card-back containers;
- strong graph-paper density;
- horizontal ownership cords that crossed the entire board without spatial tension;
- abstract `結` labels that did not preserve learned content.

### Structural, hierarchy, typography, and consistency fixes

- reduced background grid frequency and contrast;
- rebuilt card backs as clipped study tags with a diagonal stitch and central knot;
- increased night-theme metadata contrast;
- reduced the desktop title so it holds one deliberate line;
- routed pair cords through a stronger curve and toward the active player’s upper edge;
- restored diamond/solid Player 1 and square/dashed Player 2 ownership grammar.

### Conservative redesign option

If future testing finds cord accumulation too busy, keep the current tag system but show only the newest three full connections; collapse older pairs into endpoint ticks at the player edge.

### Deliberately risky redesign option

Let completed cords physically re-sort matched anchors into two player-owned constellations, changing board silhouette as the match progresses. This would require a larger interaction and accessibility prototype.

## Iteration 2 review

### Three remaining weaknesses

1. Generic `結` anchors confirmed success but did not record what the player learned.
2. Secondary text contrast remained weak in the night theme.
3. Mismatch depended mainly on exposed cards, sound, and turn transfer; it lacked a strong non-color local mark.

### Implemented fixes

- matched anchors now display the actual paired forms, such as `yo` and `よ`, or `剪刀` and `はさみ`;
- raised muted and faint text contrast in all three themes;
- reduced face-down stitch opacity so pair cords dominate the progress layer;
- added a dashed inset and `×` stitch to both mismatch cards;
- added modal focus entry, Escape close, Tab containment, and focus restoration.

## Final visual-critic scores

| Category | Score | Evidence |
|---|---:|---|
| Distinctiveness | 9 | Clipped tags, player spindles, content-bearing knots, and persistent cords remain recognizable without the logo. |
| Visual hierarchy | 8 | Setup separates identity from configuration; gameplay keeps board first and HUD compact. |
| Composition | 8 | Offset setup and edge-owned gameplay create deliberate asymmetry across wide and narrow layouts. |
| Internal consistency | 9 | Setup controls, cards, menu, result, endpoints, and motion share one cut-tag and cord grammar. |
| Relationship to mechanics | 9 | Correct pairs create persistent connections and player-owned endpoints; mismatch visibly breaks the stitch. |
| Relationship to world | 8 | The system belongs to a tactile Japanese study activity without relying on generic cultural shorthand. |
| Typography | 8 | Kana, romaji, Chinese labels, and numerals have distinct roles and content survives dense cards. |
| Readability | 8 | Night-theme contrast was increased; tested phone, tablet, and desktop states have no horizontal overflow. |
| State clarity | 9 | Player ownership uses position, text, solid/dashed line, diamond/square endpoint, and color. |
| Emotional impact | 8 | Every match leaves a visible record and moves competitive momentum toward one player edge. |
| Motion potential | 9 | Pull, tension, and wind form a coherent system with a reduced-motion equivalent. |
| Visual economy | 8 | Ambient pulses, repeated circles, glass blur, and decorative card furniture were removed. |

## Final severity-ranked action list

- Severity 1: none.
- Severity 2: none.
- Severity 3: consider a future setting that limits fully visible old cords on 20- and 25-pair boards.
- Severity 3: consider replacing remaining platform emoji with a unified illustration family when budget permits.
- Severity 4: consider labeling the chosen theme as a thread sample rather than “介面配色” in a later copy pass.

## Accessibility review

Blocking issues: none.

Major issues resolved:

- player ownership no longer relies on color alone;
- mismatch has a shape and text mark;
- turn and remaining count use polite live regions;
- the modal receives focus, contains Tab navigation, closes with Escape, and restores focus;
- reduced motion disables cord drawing and large transitions while preserving static state.

Minor open consideration:

- 10×5 boards are inherently dense. Continue testing long calendar and vocabulary strings at the smallest supported viewport.

## Acceptance criteria result

- [x] Setup does not resemble a dashboard or centered pill stack.
- [x] Cropped gameplay shows tag silhouettes, edge spindles, and pair connections.
- [x] Player ownership remains distinguishable without color.
- [x] Matched positions preserve pair history.
- [x] Kana and romaji remain readable at tested wide and narrow sizes.
- [x] No horizontal overflow at `390x667`.
- [x] Word-image pairs, scoring, remaining count, mismatch, player switch, menu, and result are verified.
- [x] No current-version console errors or warnings.
- [x] Two screenshot-based revision cycles completed.
