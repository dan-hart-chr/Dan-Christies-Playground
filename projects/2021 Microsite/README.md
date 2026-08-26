2021 Microsite — Christie's BYQ adaptation

Quickstart

1. Create project and install deps

```bash
cd /Users/dhart/Desktop/AI\ Course/Dan-Christies-Playground/projects/2021\ Microsite
npm install
```

2. Set BYQ MCP env vars (or rely on your global `mcp.json`)

```bash
export BYQ_MCP_URL="https://app.byq.supply/api/mcp"
export BYQ_MCP_TOKEN="api_xxx"
# optional: override paths
export BYQ_MCP_LIST_PATH="/packages"
export BYQ_MCP_DOWNLOAD_PATH="/packages/{id}/download"
```

3. Fetch BYQ packages (optionally pass a component id)

```bash
npm run fetch:byq -- my-component-id
# or
BYQ_COMPONENT_ID=my-component-id npm run fetch:byq
```

4. Edit the token mapping at `design-system/token-mapping/byq-to-christies.json`, then generate the theme

```bash
npm run generate:theme
```

Notes

- `scripts/fetch-byq-mcp.js` is intentionally flexible: set `BYQ_MCP_LIST_PATH` and `BYQ_MCP_DOWNLOAD_PATH` if BYQ's API differs from the defaults.
- `scripts/generate-theme.js` reads the workspace `design-system/tokens.json` by default (relative path). Adjust that path if you want to keep a local copy.

Next steps

- Tell me which BYQ component you want to test and I will adapt it using the generated theme and provide a wrapper example.
