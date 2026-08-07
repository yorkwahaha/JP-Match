# JP Match Online Multiplayer — Pre-selection Brief

Status: **Direction B — 雙端線軸 selected. Approved for implementation on 2026-08-06.**

## Product boundary

The online mode is a private, two-player, no-registration extension of the existing game. One player creates a room and shares a short code or link. The other joins with a temporary display name. The room server owns the deck, validates turns, and broadcasts public state. Pronunciation, sound effects, BGM, learning data, themes, and reduced-motion behavior stay on each device.

Every direction below preserves the selected `ことば結び / Pairing Cord` visual system. They differ in information architecture, lobby composition, framing, and how two remote players become visibly connected.

## Direction A — 結び札 / The Join Tag

Category: restrained and editorial.

1. **Design thesis:** Online play should feel like adding one addressed study tag to the existing setup sheet.
2. **Player emotion:** Immediate confidence; creating or joining a room should take only one obvious decision.
3. **Visual metaphor:** A detachable correspondence tag carrying either a room code or an invitation link.
4. **Signature element:** The six-character room code is typeset as three paired knots, such as `JP · 7K · 2Q`, and can be copied as one invitation tag.
5. **Dominant composition:** Keep the current setup composition. Replace the current player-count choice with `單人 / 同機雙人 / 線上雙人`; selecting online unfolds one narrow join rail beneath it.
6. **Deliberate asymmetry:** Create-room is the strong action at the rail's leading edge; join-by-code is a quieter trailing action.
7. **Typography:** Room codes use large tabular uppercase glyphs; player names remain secondary labels; learning typography is unchanged.
8. **Shape rules:** One clipped invitation tag, one ruled code field, and one pull-tab action. No stack of equal lobby cards.
9. **Material rules:** Existing paper tag, ink, and cord materials only. Connection status is a short woven line, not a glowing network icon.
10. **Motion:** The invitation tag tears free on create, then a second anchor appears when the guest joins. Reduced motion swaps these states instantly.
11. **Gameplay relationship:** The host's settings remain the familiar setup; the guest attaches to that setup and sees a read-only summary before readying.
12. **Risks:** The online state can feel too quiet; reconnect and waiting messages need excellent copy and status hierarchy.
13. **Why it belongs to JP Match:** A remote opponent is represented as the missing end of the same study cord, not as a generic account or chat lobby.

## Direction B — 雙端線軸 / The Two Spindles

Category: mechanic-driven. **Recommended.**

1. **Design thesis:** Creating a match means establishing tension between two player-owned endpoints before the first card is revealed.
2. **Player emotion:** Anticipation and clear competitive presence; each player should feel the other endpoint arrive.
3. **Visual metaphor:** Two edge spindles connected by an initially slack cord that becomes taut when both players are ready.
4. **Signature element:** The room screen is one horizontal or vertical cord with two named endpoints, connection state in its tension, and the room code tied at the midpoint.
5. **Dominant composition:** A dedicated compact lobby sits between setup and gameplay. Host settings form a narrow central strip; player endpoints own opposite edges.
6. **Deliberate asymmetry:** The host endpoint also owns the settings knot; the guest endpoint owns readiness but cannot silently change the deck.
7. **Typography:** Player names align to their endpoint shapes; the room code sits at the cord midpoint; settings read like small labels tied along the cord.
8. **Shape rules:** Diamond endpoint for Player 1, square endpoint for Player 2, one midpoint room knot, and no generic avatar circles.
9. **Material rules:** Existing cord patterns and clipped tags. Online state is expressed through slack, taut, broken, or re-tied cord states.
10. **Motion:** Join tightens the cord, ready winds each spindle once, start pulls the lobby line open into the game board. Disconnect releases one end without shaking the whole screen.
11. **Gameplay relationship:** The same two endpoints continue directly into the existing score spindles, making lobby ownership and in-game ownership one continuous system.
12. **Risks:** Adds a separate screen and a little more ceremony; short-phone layout must keep room code, both players, and ready controls above the fold.
13. **Why it belongs to JP Match:** The online handshake is literally the first pair connection and flows into the game's persistent pair-cord grammar.

## Direction C — 結びの待合棚 / The Waiting Rack

Category: diegetic and world-integrated.

1. **Design thesis:** Two learners hang their study tags on a shared rack before opening the board together.
2. **Player emotion:** Welcoming, social, and lightly ceremonial without requiring profiles or chat.
3. **Visual metaphor:** A small learning-room rack holding two named tags, the selected lesson bundle, and one empty/occupied hook.
4. **Signature element:** The second player's tag visibly arrives on the empty hook; the rack's central knot becomes the start handle.
5. **Dominant composition:** A distinct waiting-room scene with the lesson bundle hanging below and the two player tags placed at unequal heights.
6. **Deliberate asymmetry:** Host tag is tied to the lesson bundle; guest tag swings in from the open side and controls only its ready state.
7. **Typography:** Names are handwritten-style annotations within the existing type system; lesson content remains disciplined Mincho/Gothic.
8. **Shape rules:** Hooks, hanging tag silhouettes, and a single shelf line. Controls remain embedded in objects rather than boxed panels.
9. **Material rules:** Paper tags, woven ties, wood or textile rack accents, with no tourist motifs or decorative Japanese architecture.
10. **Motion:** Hang, settle, and bind. A disconnected player tag lifts off the hook; reduced motion uses hook occupancy and text alone.
11. **Gameplay relationship:** The selected lesson is a physical bundle both learners agree to open, preserving the sense of shared study.
12. **Risks:** Highest illustration and responsive-layout cost among the safe directions; may slow frequent rematches if over-animated.
13. **Why it belongs to JP Match:** The social space is made from the same learning tags that encode kana, romaji, pictures, and paired knowledge.

## Direction D — 招待糸 / The Live Invitation Thread

Category: high-risk and experimental.

1. **Design thesis:** Eliminate the conventional lobby; the invitation link itself is a live thread that stretches from the host's setup into the guest's screen.
2. **Player emotion:** Surprise and immediacy, as if the second device physically completes the first device's interface.
3. **Visual metaphor:** One cord crosses the screen boundary. The host holds one end; opening the link reveals the other end on the guest device.
4. **Signature element:** Each device displays only its half of the invitation cord until connected; together, their endpoint shapes form the room mark.
5. **Dominant composition:** Host configures and shares from setup; guest lands on a minimal acceptance surface; both transition directly to the board when ready.
6. **Deliberate asymmetry:** Host and guest screens are intentionally different. Host owns configuration; guest sees a lesson preview and accept/leave actions.
7. **Typography:** The invite link is never shown as a raw URL. A short verbal room phrase and endpoint mark carry identity.
8. **Shape rules:** One strong cross-screen diagonal, two endpoint shapes, and no central lobby panel or room-list container.
9. **Material rules:** Existing tag and cord materials, with the screen edge treated as a meaningful cut rather than a decorative frame.
10. **Motion:** The cord enters from the physical edge associated with the remote player; reconnect rethreads that same edge. Reduced motion uses a static edge anchor and status copy.
11. **Gameplay relationship:** Remote presence is spatial from the first moment and continues into turn ownership at the board edge.
12. **Risks:** Hardest state model and QA burden; share-link failures, delayed joins, host cancellation, and short-phone browser chrome can make the metaphor confusing. Manual code entry needs a fallback surface.
13. **Why it belongs to JP Match:** It turns two separate devices into the two ends of the same representation-connecting mechanic.

## Recommendation

Choose **Direction B — 雙端線軸**. It makes connection, readiness, host authority, player identity, and the transition into the current HUD legible without account UI or generic lobby cards. It is more memorable than Direction A while carrying much less interaction risk than Direction D.

Direction A is the low-ceremony alternative. Direction C is best if warmth and a sense of place matter more than speed. Direction D should only be selected if an experimental cross-device entrance is worth a larger test and recovery surface.

## Selected visual-system contract

- Primary shape rules: Player 1 keeps a diamond endpoint and solid cord; Player 2 keeps a square endpoint and broken cord; the room code occupies one midpoint knot.
- Forbidden shapes: no avatar circles, account cards, generic lobby tiles, or pill-shaped status badges.
- Dominant gesture: a slack line between two edge spindles becomes taut only when both players are connected and ready.
- Deliberate asymmetry: the host endpoint owns the lesson-settings knot; the guest endpoint owns only its name and readiness.
- Signature interaction: pressing ready winds the player's spindle once and locks that endpoint into the room cord.
- Signature transition: the taut lobby cord opens vertically into the first board row, preserving endpoint ownership in the game HUD.
- Success reaction: both endpoints tighten once when a pair is claimed; the existing persistent match cord remains the primary reward.
- Failure reaction: the room cord briefly shows a broken stitch near the active endpoint; the board retains the existing mismatch mark.
- Typography: room codes use stable-width uppercase characters grouped as three pairs; names stay short, readable, and subordinate to learning text.
- Urgency: reconnect countdown copy and a shortening broken cord communicate time without pulsing the whole screen.
- Progression: ready state, match cords, scores, and remaining pairs form one continuous tension system.
- Maximum simultaneous effects: one room/connection transition plus one local button response; gameplay keeps the existing one reveal plus one ownership event limit.

### Component and state map

- Setup: `play-mode` choice, temporary name field, optional room-code field, create/join actions, and a short privacy note.
- Room: room-code midpoint, copy-link action, two player endpoints, connection/ready state, host-owned lesson summary, ready/leave actions, and a polite live status region.
- Gameplay: existing board and score spindles, plus local-seat and connection state. Only the active connected seat can submit a flip.
- Result: existing result hierarchy, with rematch readiness returning both players to the same room rather than creating accounts or permanent history.
- Connection states: idle, creating, joining, lobby-connected, lobby-reconnecting, playing, playing-reconnecting, complete, closed, and unrecoverable error.
- Responsive rule: wide screens place endpoints at left and right; portrait screens stack them above and below the midpoint knot without rotating player text.
- Accessibility: endpoint geometry, line pattern, labels, text status, and position all reinforce connection and readiness; no state relies on color or motion alone.
- Acceptance: room code and both seats fit at `390x667`; the ready action remains reachable; disconnect does not erase the board; reduced motion preserves every state; keyboard focus remains visible and ordered.

## Shared technical contract

- Two-player private rooms only for the first release; no matchmaking, chat, spectators, profiles, rankings, or permanent history.
- A random anonymous reconnect token is stored locally; it contains no email, password, or required personal information.
- Room codes use an ambiguity-safe alphabet and are rate-limited at the service boundary.
- The server creates the ordered deck and validates every flip against room phase, seat, turn, locks, matched pairs, and action sequence.
- Clients receive public room state plus only the card faces they are allowed to know.
- Every accepted action increments a monotonic state version; stale or duplicate commands are rejected safely.
- A successful pair keeps the current player; a mismatch switches players after the existing visible hold.
- Local audio is triggered from authoritative reveal events. The server never streams pronunciation audio.
- A disconnected seat is reserved for a short reconnect window. The remaining player sees a non-blocking status and cannot take both turns.
- Rooms expire automatically after inactivity. A host can close an unstarted room; an active match ends only through explicit leave/timeout rules.
- Online endpoints must be added to the Content Security Policy for HTTPS and WebSocket connections.

## Selection question

Which online-room direction should be implemented: **A 結び札**, **B 雙端線軸**, **C 結びの待合棚**, or **D 招待糸**?
