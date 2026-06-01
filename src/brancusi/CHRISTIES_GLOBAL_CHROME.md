# Christie's Header/Footer Integration

This Brancusi microsite is a Vite vanilla JavaScript app, not a React or Next.js app. For this stack, use the legacy bridge package from `christies/christies-dotcom-web-ui`:

```sh
@christies/react-legacy-integration
```

Do not start with direct `@christies/header` and `@christies/footer` imports here. The bridge package bundles React and exposes `HeaderWithDataProvider`, `FooterWithDataProvider`, `AuthContext`, and `ReactTools` for non-React applications.

## Package Access

This folder includes `.npmrc` so the `@christies` scope resolves to GitHub Packages. The token must have `read:packages` access and should be supplied through the environment, not committed:

```sh
export NODE_AUTH_TOKEN=<github-token-with-read-packages>
npm install @christies/react-legacy-integration@^3.6.0
```

Observed package versions from `christies/christies-dotcom-web-ui` on 2026-05-19:

```txt
@christies/react-legacy-integration 3.6.0
@christies/header 6.5.1
@christies/footer 3.4.1
@christies/authentication 3.1.0
```

## Current Brancusi Wiring

`index.html` mounts the official chrome around the existing immersive app:

```html
<body>
  <div id="headerHost" class="christies-chrome-host"></div>
  <div id="app"></div>
  <div id="footerHost" class="christies-chrome-host"></div>
  <script type="module" src="/src/main.js"></script>
</body>
```

`src/main.js` imports `mountChristiesGlobalChrome()` before starting the experience UI.

`src/christiesGlobalChrome.js` imports the package's built output directly:

```js
import ReactTools, {
  AuthContext,
  FooterWithDataProvider,
  HeaderWithDataProvider,
} from "../node_modules/@christies/react-legacy-integration/dist/index.js";
import christiesChromeCss from "../node_modules/@christies/react-legacy-integration/dist/index.css?inline";
```

The direct `dist` import matches the package's own legacy sample and avoids relying on its source export path in this Vite app. The CSS is imported as inline text and injected into each chrome host's Shadow DOM.

Both header and footer roots are rendered inside `AuthContext.Provider`. `@christies/react-legacy-integration` uses that context for the visible header auth controls:

```js
{
  login: () => window.location.assign(buildAuthLoginUrl(language)),
  logout: () => window.location.assign(buildAuthLogoutUrl()),
  isAuthenticated: authState.isAuthenticated,
  getToken: () => "",
}
```

`isAuthenticated` is checked with the v2 auth refresh endpoint and then the header is re-rendered if a Christie’s session exists:

```sh
https://api.christies.com/auth/refresh
```

Login and logout use the Auth0 redirect endpoints from the production content-service response:

```sh
https://www.christies.com/auth/login
https://www.christies.com/auth/logout
```

ENS confirmed that these login/logout redirects work. Do not use `NODE_AUTH_TOKEN` here; that token is only for installing the private npm package.

ENS also confirmed that footer modal support still needs the old Stencil DSL `chr-modal-provider`. The page loads the DSL runtime and includes `<chr-modal-provider>`, so the footer can dispatch its modal events. The Stencil DSL is retained for modal support, not as the visible header/footer renderer.

## Data API

Local development uses a Vite proxy:

```js
proxy: {
  "/header-footer-content": {
    target: "https://api.christies.com",
    changeOrigin: true,
    secure: true,
  },
  "/christies-auth": {
    target: "https://api.christies.com",
    changeOrigin: true,
    secure: true,
    rewrite: (path) => path.replace(/^\/christies-auth/, "/auth"),
  },
}
```

The component fetcher and auth refresh call send `Accept: application/vnd.christies.v1+json`. A plain `curl` without that header can return `404`.

The mounted URLs include:

```txt
language=<en|zh-hant|zh-hans>
urlFormat=absolute
```

`cnDomain=true` is added only when `VITE_CHRISTIES_CN_DOMAIN=true` or the hostname ends in `.com.cn`. Otherwise it is omitted because `false` is the service default.

Production uses the public Content Service:

```sh
https://api.christies.com/header-footer-content/header
https://api.christies.com/header-footer-content/footer
```

`VITE_HEADER_FOOTER_DATA_API` can override the base URL if an environment needs a proxy. ENS confirmed that pages under a `christies.com` domain can call the production service directly from the browser; non-Christie's domains may need a hosting-layer proxy.

The previous `https://intapi.christies.com/header-footer-content` URL is SIT/integration and should not be used for production. Final content is owned by the Content Editors team and managed through Sitecore CMS.

## Layout Notes

The old Brancusi custom logo and footer were removed from `src/showcaseUi.js` to avoid duplicate Christie information.

The document now scrolls naturally:

1. Official global header.
2. Existing `#app` immersive experience at `100dvh`.
3. Official global footer below the experience.

The package CSS includes Tailwind/reset rules, so it is injected only inside the header/footer Shadow DOM roots instead of imported globally.

## CSS And Fonts

ENS recommended Shadow DOM isolation for both Header and Footer. `src/christiesGlobalChrome.js` attaches an open shadow root to `#headerHost` and `#footerHost`, injects the package CSS into each shadow root, and mounts the React component inside that root.

Fonts are loaded from the shared DSL production stylesheet in `index.html`:

```html
<link rel="stylesheet" href="https://dsl.assets.christies.com/design-system-library/production/arizona.css" />
```

The local Brancusi CSS uses the same `ABCArizonaSans` and `ABCArizonaSerif` family names with CSS variable fallbacks matching the package CSS.

## Stencil DSL Modal Provider

The footer's QR/image modal path depends on the Stencil DSL modal provider. The page loads the production DSL assets in `index.html`:

```html
<link rel="stylesheet" href="https://dsl.assets.christies.com/design-system-library/production/christies-design-system-library-header-footer.css" />
<script type="module" src="https://dsl.assets.christies.com/design-system-library/production/christies-design-system-library.esm.js"></script>
<script nomodule src="https://dsl.assets.christies.com/design-system-library/production/christies-design-system-library.js"></script>
```

It also provides the modal close label and mounts the provider:

```html
<script>
  window.chrGlobal = window.chrGlobal || {};
  window.chrGlobal.labels = {
    ...(window.chrGlobal.labels || {}),
    close_modal_txt: "Close"
  };
</script>

<div class="chr-header-footer">
  <chr-modal-provider></chr-modal-provider>
</div>
```

Do not add visible `chr-header` or `chr-footer` web components here. The microsite uses the new React legacy integration package for visible Header/Footer and only uses Stencil DSL for modal support.
