# NSL design verification

Responsive Next.js web application; Apple's accessibility and foundation principles apply, rather than native iOS navigation conventions. Reviewed rendered desktop (1440 px) and mobile (390 px) pages and browser interactions.

The visual identity centers on condensed sports typography, the original club crests, a league scoreboard, and club-colored player cards. Navy and green follow the supplied brief. No fixtures, player photos, results, or activity were fabricated.

## Accessibility checks

- Main text `#F8FAFC` on `#080B12`: **18.81:1**.
- Secondary text `#9AA6B9` on `#11151E`: **7.42:1**.
- Primary button text `#092008` on `#77FF73`: **13.37:1**.
- Mobile primary buttons and navigation use 44 px targets. Wide standings and calendar views scroll within their panels; no tested route overflowed the viewport.
- Dialogs use Radix focus management, labeled headings, Escape dismissal, and explicit Cancel/Close controls.
- Keyboard focus, skip link, loading states, inline errors, reduced motion, reduced transparency, and increased contrast are provided.
- Statuses include words and icons, not color alone. No animation carries essential information.

Reference: Apple HIG `accessibility.md › Vision`: “Strive to meet color contrast minimum standards.” Measured ratios above exceed the 4.5:1 small-text threshold for these core tokens. These figures are not a claim that every decorative or secondary token received a complete WCAG audit.

## Verified flows

Desktop and mobile browser checks cover public routes, roster switching, calendar modes, Google PKCE initiation, rating confirmation, reservation validation, and trade review. SQL integration checks separately verify actual authorization and atomic mutations.

The Google consent screen and a real user's first authenticated session require that account holder. No claim of automated interactive Google consent testing is made.
