function Separator() {
  return <span className="inline-block h-[15px] w-px shrink-0 bg-[#f0e8d7] opacity-50" />;
}

const HOME_URL = 'https://www.christies.com/en';
const COLLECTION_URL =
  'https://www.christies.com/en/auction/masterpieces-the-private-collection-of-s-i-newhouse-31380/';
const BRANCUSI_URL = 'https://experience.christies.com/brancusi/';
const FOOTER_LINK_CLASS =
  'shrink-0 whitespace-nowrap text-[14px] font-normal uppercase leading-[1.2] text-[#f0e8d7] no-underline cursor-pointer hover:opacity-80 transition-opacity';
const COOKIE_BUTTON_CLASS = `footer-cookie-button ot-sdk-show-settings ${FOOTER_LINK_CLASS} !border-0 !bg-transparent !p-0 !shadow-none !font-normal !uppercase !leading-[1.2] !text-[14px] !text-[#f0e8d7] !no-underline`;

function CookieSettingsButton() {
  return (
    <button id="ot-sdk-btn" type="button" className={COOKIE_BUTTON_CLASS}>
      Cookie settings
    </button>
  );
}

export default function Footer() {
  return (
    <footer className="absolute bottom-0 left-0 z-20 w-full bg-black">
      {/* ===== DESKTOP ===== */}
      <div className="hidden w-full px-6 py-9 md:block">
        <div className="flex w-full items-center gap-[114px]">
          {/* Breadcrumbs */}
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 px-4">
            <a
              href={HOME_URL}
              className={FOOTER_LINK_CLASS}
            >
              HOME
            </a>
            <Separator />
            <a
              href={COLLECTION_URL}
              className={FOOTER_LINK_CLASS}
            >
              VIEW COLLECTION
            </a>
            <Separator />
            <CookieSettingsButton />
            <Separator />
            <a
              href={BRANCUSI_URL}
              className={FOOTER_LINK_CLASS}
            >
              View Brancusi&apos;s Danaïde
            </a>
          </div>
          {/* Copyright */}
          <p className="shrink-0 whitespace-nowrap text-[12px] font-normal uppercase leading-[1.2] text-[#f0e8d7]">
            &copy; CHRISTIE&apos;S 2026
          </p>
        </div>
      </div>

      {/* ===== MOBILE ===== */}
      <div className="flex w-full flex-col gap-1 pt-8 md:hidden">
        {/* Breadcrumbs */}
        <div className="flex flex-wrap items-center gap-3 px-4">
          <a
            href={HOME_URL}
            className={FOOTER_LINK_CLASS}
          >
            HOME
          </a>
          <Separator />
          <a
            href={COLLECTION_URL}
            className={FOOTER_LINK_CLASS}
          >
            VIEW COLLECTION
          </a>
          <Separator />
          <CookieSettingsButton />
          <Separator />
          <a
            href={BRANCUSI_URL}
            className={FOOTER_LINK_CLASS}
          >
            View Brancusi&apos;s Danaïde
          </a>
        </div>

        {/* Copyright */}
        <div className="flex w-full flex-col items-center px-4 py-[26px]">
          <p className="whitespace-nowrap text-[12px] font-normal uppercase leading-[1.2] text-[#f0e8d7]">
            &copy; CHRISTIE&apos;S 2026
          </p>
        </div>
      </div>
    </footer>
  );
}
