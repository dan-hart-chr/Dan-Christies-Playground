Figma → Code Mapping Guide (MCP + Code Connect)

1. Token naming
- In Figma, name colour styles exactly to match tokens.json keys, e.g. `colors/primary`, `colors/neutral-700`.
- Name text styles to align with typography keys, e.g. `type/base`, `type/heading/2xl`.

2. Export tokens
- Use a Figma Tokens plugin (or design token export) to produce JSON that matches `tokens.json` structure.

3. Code Connect and MCP
- Use Code Connect to map Figma components to code components (stable exported component names).
- When running design-to-code flows, call `search_design_system` first to find matching Figma components.
- Call `get_design_context` with the node id; prefer design- to-code skill guidance to adapt tokens.

4. Workflow tips
- Keep tokens authoritative: update both `tokens.json` and Figma tokens in the same change.
- Use semantic token names (primary, accent, neutral-700) rather than `#hex` in code.
- Add a `last-updated` note in the design-system folder when tokens change.

5. Automation
- Consider a CI job to validate Figma JSON exports against `tokens.json` keys.
