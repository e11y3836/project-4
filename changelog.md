# Changelog

## Unreleased

### Added

- Created the API showcase page with a floral, pastel visual theme, responsive layouts, decorative header, and light/dark color themes. Added reduced-motion styling and visible keyboard focus states.
- Added four selectable data pairings:
  - Hacker News top stories and current weather for six Malaysian cities via wttr.in.
  - Smartphone and laptop product listings from DummyJSON.
  - All recipes and snack recipes from DummyJSON.
  - User profiles and quotes from DummyJSON.
- Normalized API results into consistent cards with titles, descriptions, categories, dates, authors, images, and source links where available. Added generated SVG placeholders and HTTP error handling for requests.
- Added independent primary and secondary panels with paginated loading, per-panel item counts, loading indicators, empty states, error messages, and retry controls. Added refresh to clear cached API pages and reload the current pages.
- Added five-minute localStorage caching keyed by the selected pairing, panel, and page, plus cache-hit tracking.
- Added search across loaded results in both panels, with Search-button and Enter-key submission and a clear control. Added category filtering and sorting by newest, oldest, name, or search relevance.
- Added grid and list layouts, selectable from the shared view toggle.
- Added item cards with favorite controls and detail modals showing item metadata and available source URLs. The modal closes from its close button or overlay.
- Added favorites management with localStorage persistence, a favorites list, individual removal, and a two-click Clear All confirmation.
- Added a persisted light/dark theme toggle and footer statistics for items viewed, searches, favorites, and cache hits.
- Added the Petal Catch mini-game: catch a moving target on a nine-spot board during a 15-second round, track the score, and save the high score locally.
