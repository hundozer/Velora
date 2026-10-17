# Intimo branding migration register

Intimo is the sole current product name. User-facing copy, transactional sender identity and support addresses use Intimo and `intimo.live`.

Legacy `Velora` identifiers are retained only where immediate renaming would create migration risk:

- Git repository/project/package name (`Velora`, npm package `velora`) and existing deployment identifiers.
- Tailwind design-token class names such as `velora-bg` and `velora-gold`; these are internal CSS compatibility keys, not displayed copy.
- Historical TypeScript symbols such as `VeloraEvent` used only by disabled future event code.
- The one-time `velora_lang` local-storage read in `LanguageContext`; it migrates the value to `intimo_lang` and deletes the legacy key.
- Legacy database/schema documentation retained for migration comparison and rollback history.

Disabled payment, creator-studio, live, event and related legacy modules may still contain historical identifiers. They remain inaccessible under the free-MVP middleware boundary and must be renamed or removed before any future reactivation.
