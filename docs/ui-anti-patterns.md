# JP Match UI Anti-patterns

## Styled web-form setup

Symptom:

- the setup screen is a centered stack of equal labels, pills, and full-width selects;
- all choices appear equally important.

Fix:

- restructure setup around content, play mode, and start readiness using the selected game metaphor.

## Uniform card decoration

Symptom:

- rings, corner brackets, glow, and gradients decorate every card without explaining its representation or state.

Fix:

- let card construction encode romaji, kana, picture, state, or pair relationship; delete the rest.

## Empty progress holes

Symptom:

- matched cards vanish and leave blank grid cells that communicate removal but not learning or ownership.

Fix:

- turn completed pairs into a meaningful persistent trace defined by the selected direction.

## Effect substitution

Symptom:

- pulsing edges, glow, gradients, shadows, or particles compensate for weak hierarchy.

Fix:

- remove effects temporarily and verify the screen in grayscale and at thumbnail size.

## Generic Japanese shorthand

Symptom:

- red suns, torii, gold frames, random ink brush marks, or “Zen” minimalism are used without a connection to learning or matching.

Fix:

- derive motifs from script comparison, pronunciation, memory, pair formation, and two-player play.

## Mixed asset language without framing

Symptom:

- custom dimensional home-object stickers and platform emoji appear as if they belong to one illustration set.

Fix:

- normalize presentation through a deliberate frame/material system or define distinct content families explicitly.

## Color-only turn ownership

Symptom:

- the active player is communicated mainly by a blue or orange edge glow.

Fix:

- combine spatial movement, player-side geometry, labels, and stable markers with color.

## Motion everywhere

Symptom:

- turn banner, arrows, edges, score, cards, and background all pulse or move continuously.

Fix:

- reserve motion for reveal, comparison, match/mismatch, and turn transfer; keep the rest still.
