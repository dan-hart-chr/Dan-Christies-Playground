import ReactTools, {
  AuthContext,
  FooterWithDataProvider,
  HeaderWithDataProvider,
} from "../node_modules/@christies/react-legacy-integration/dist/index.js";
import christiesChromeCss from "../node_modules/@christies/react-legacy-integration/dist/index.css?inline";

const DEFAULT_HEADER_FOOTER_API = import.meta.env.DEV
  ? "/header-footer-content"
  : "https://api.christies.com/header-footer-content";

const STAGING_HEADER_FOOTER_API = "https://stgapi.christies.com/header-footer-content";

const DEFAULT_AUTH_API = import.meta.env.DEV ? "/christies-auth" : "https://api.christies.com/auth";

const STAGING_AUTH_API = "https://stgapi.christies.com/auth";
const DEFAULT_AUTH_ORIGIN = "https://www.christies.com";
const DEFAULT_CN_AUTH_ORIGIN = "https://www.christies.com.cn";

const LANGUAGE_MAP = {
  en: "en",
  zh: "zh-hant",
  "zh-cn": "zh-hans",
};

const AUTH_LOCALE_MAP = {
  en: "en",
  "zh-hant": "zh-TW",
  "zh-hans": "zh-CN",
};

const authState = {
  isAuthenticated: false,
};

function getChromeLanguage() {
  const params = new URLSearchParams(window.location.search);
  return LANGUAGE_MAP[params.get("sc_lang")] || "en";
}

function isStagingHost() {
  return /-stg\./.test(window.location.hostname);
}

function getHeaderFooterApiBase() {
  const base =
    import.meta.env.VITE_HEADER_FOOTER_DATA_API ||
    (isStagingHost() ? STAGING_HEADER_FOOTER_API : DEFAULT_HEADER_FOOTER_API);
  return base.replace(/\/$/, "");
}

function getAuthApiBase() {
  const base =
    import.meta.env.VITE_CHRISTIES_AUTH_API ||
    (isStagingHost() ? STAGING_AUTH_API : DEFAULT_AUTH_API);
  return base.replace(/\/$/, "");
}

function getAuthOrigin() {
  return (
    import.meta.env.VITE_CHRISTIES_AUTH_ORIGIN ||
    (isCnDomain() ? DEFAULT_CN_AUTH_ORIGIN : DEFAULT_AUTH_ORIGIN)
  ).replace(/\/$/, "");
}

function createMount(hostId) {
  const host = document.getElementById(hostId);
  if (!host) return null;

  const shadow = host.shadowRoot || host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = christiesChromeCss;

  const mount = document.createElement("div");
  mount.setAttribute("part", "mount");

  shadow.replaceChildren(style, mount);
  return mount;
}

function isCnDomain() {
  if (import.meta.env.VITE_CHRISTIES_CN_DOMAIN === "true") return true;
  return window.location.hostname.endsWith(".com.cn");
}

function buildChromeUrl(path, language) {
  const url = new URL(`${getHeaderFooterApiBase()}${path}`, window.location.origin);
  url.searchParams.set("language", language);
  url.searchParams.set("urlFormat", "absolute");
  if (isCnDomain()) {
    url.searchParams.set("cnDomain", "true");
  }
  return url.toString();
}

function buildAuthLoginUrl(language) {
  const returnTo = new URL(
    `${window.location.pathname}${window.location.search}`,
    window.location.origin,
  );
  returnTo.searchParams.set("host", returnTo.host);

  const url = new URL("/auth/login", getAuthOrigin());
  url.searchParams.set("ui_locales", AUTH_LOCALE_MAP[language] || "en");
  url.searchParams.set("returnTo", `${returnTo.pathname}${returnTo.search}`);
  return url.toString();
}

function buildAuthLogoutUrl() {
  const redirectAfterLogout = new URL(window.location.href);
  const callbackUrl = new URL("/auth/callback-logout", getAuthOrigin());
  callbackUrl.searchParams.set("redirectAfterLogout", redirectAfterLogout.toString());

  const url = new URL("/auth/logout", getAuthOrigin());
  url.searchParams.set("returnTo", callbackUrl.toString());
  return url.toString();
}

function createAuthParams(language) {
  return {
    login: () => {
      window.location.assign(buildAuthLoginUrl(language));
    },
    logout: () => {
      window.location.assign(buildAuthLogoutUrl());
    },
    isAuthenticated: authState.isAuthenticated,
    getToken: () => "",
  };
}

function withAuthProvider(element, language) {
  return ReactTools.createElement(
    AuthContext.Provider,
    { value: createAuthParams(language) },
    element,
  );
}

async function refreshAuthState() {
  try {
    const response = await fetch(`${getAuthApiBase()}/refresh`, {
      credentials: "include",
      headers: {
        Accept: "application/vnd.christies.v1+json",
      },
    });

    if (!response.ok) {
      return false;
    }

    return (await response.json()).refresh_successful === true;
  } catch {
    return false;
  }
}

function renderChristiesGlobalChrome({ headerRoot, footerRoot, language }) {
  if (headerRoot) {
    headerRoot.render(
      withAuthProvider(
        ReactTools.createElement(HeaderWithDataProvider, {
          url: buildChromeUrl("/header", language),
          useLegacyLanguageSwitcher: true,
        }),
        language,
      ),
    );
  }

  if (footerRoot) {
    footerRoot.render(
      withAuthProvider(
        ReactTools.createElement(FooterWithDataProvider, {
          url: buildChromeUrl("/footer", language),
        }),
        language,
      ),
    );
  }
}

export function mountChristiesGlobalChrome() {
  const language = getChromeLanguage();
  const headerMount = createMount("headerHost");
  const footerMount = createMount("footerHost");
  const headerRoot = headerMount ? ReactTools.createRoot(headerMount) : null;
  const footerRoot = footerMount ? ReactTools.createRoot(footerMount) : null;

  renderChristiesGlobalChrome({ headerRoot, footerRoot, language });

  refreshAuthState().then((isAuthenticated) => {
    if (authState.isAuthenticated === isAuthenticated) return;
    authState.isAuthenticated = isAuthenticated;
    renderChristiesGlobalChrome({ headerRoot, footerRoot, language });
  });
}
