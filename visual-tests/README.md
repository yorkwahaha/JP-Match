# JP Match Visual Tests

Store fixed screenshots or automated visual-regression outputs here. Do not commit throwaway browser captures.

`online-room.html` is the stable, no-network fixture for the selected 雙端線軸 lobby. It uses the production room classes in a one-ready, both-connected state so responsive and reduced-motion styling can be reviewed when the Durable Object development runtime is unavailable.

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
- `online-room-one-ready`

Use filenames in the form `<viewport>-<state>-<iteration>.png`, for example `390x844-game-match-v1.png`. Keep state and viewport names stable so before-and-after comparisons remain reliable.
