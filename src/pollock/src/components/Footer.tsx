function Separator() {
  return <span className="inline-block h-[15px] w-px shrink-0 bg-[#f0e8d7] opacity-50" />;
}

const POLLOCK_LOT_URL =
  'https://www.christies.com/lot/jackson-pollock-1912-1956-number-7a-1948-6585089/?intObjectID=6585089&lid=1';

export default function Footer() {
  return (
    <footer className="absolute bottom-0 left-0 z-20 w-full bg-black">
      {/* ===== DESKTOP ===== */}
      <div className="hidden w-full px-6 py-9 md:block">
        <div className="flex w-full items-center gap-[114px]">
          {/* Breadcrumbs */}
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 px-4">
            <a
              href="#"
              className="shrink-0 whitespace-nowrap text-[14px] font-normal uppercase leading-[1.2] text-[#f0e8d7] no-underline cursor-pointer hover:opacity-80 transition-opacity"
            >
              HOME
            </a>
            <Separator />
            <a
              href="#"
              className="shrink-0 whitespace-nowrap text-[14px] font-normal uppercase leading-[1.2] text-[#f0e8d7] no-underline cursor-pointer hover:opacity-80 transition-opacity"
            >
              VIEW COLLECTION
            </a>
            <Separator />
            <a
              href={POLLOCK_LOT_URL}
              data-analytics="pollock7a:footerLink"
              className="shrink-0 whitespace-nowrap text-[14px] font-normal uppercase leading-[1.2] text-[#f0e8d7] no-underline cursor-pointer hover:opacity-80 transition-opacity"
            >
              VIEW POLLOCK 7A
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
            href="#"
            className="shrink-0 whitespace-nowrap text-[14px] font-normal uppercase leading-[1.2] text-[#f0e8d7] no-underline cursor-pointer hover:opacity-80 transition-opacity"
          >
            HOME
          </a>
          <Separator />
          <a
            href="#"
            className="shrink-0 whitespace-nowrap text-[14px] font-normal uppercase leading-[1.2] text-[#f0e8d7] no-underline cursor-pointer hover:opacity-80 transition-opacity"
          >
            VIEW COLLECTION
          </a>
          <Separator />
          <a
            href={POLLOCK_LOT_URL}
            data-analytics="pollock7a:footerLink"
            className="shrink-0 whitespace-nowrap text-[14px] font-normal uppercase leading-[1.2] text-[#f0e8d7] no-underline cursor-pointer hover:opacity-80 transition-opacity"
          >
            VIEW POLLOCK 7A
          </a>
        </div>

        {/* Copyright */}
        <div className="flex w-full flex-col items-center px-4 py-[26px]">
          <p className="whitespace-nowrap text-[12px] font-normal uppercase leading-[1.2] text-[#f0e8d7]">
            &copy; CHRISTIE&apos;S 2026
          </p>
        </div>
      </div>
      <div className="flex w-full flex-col items-center px-4 py-[26px]">
      {/* OneTrust cookies settings button start */}
      <button id="ot-sdk-btn" className="whitespace-nowrap text-[12px] font-normal uppercase leading-[1.2] text-[#f0e8d7]">Cookie settings</button>
      {/* OneTrust cookies settings button end */}
      </div>
    </footer>
  );
}
