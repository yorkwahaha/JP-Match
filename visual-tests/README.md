# JP Match Visual Tests

Store fixed screenshots or automated visual-regression outputs here. Do not commit throwaway browser captures.

## Viewports

- `1280x720`
- `768x1024`
- `390x844`
- `390x667`

## Required states

- `setup-kana`
- `setup-words`
- `game-facedown-dual`
- `game-facedown-solo`
- `game-one-revealed`
- `game-match`
- `game-mismatch-player-2`
- `menu`
- `result-win`
- `result-tie`
- `reduced-motion`

Use filenames in the form `<viewport>-<state>-<iteration>.png`, for example `390x844-game-match-v1.png`. Keep state and viewport names stable so before-and-after comparisons remain reliable.
