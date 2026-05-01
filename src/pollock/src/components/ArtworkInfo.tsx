import type { CSSProperties } from 'react';

const logoStyle = {
  '--christies-logo-url': `url("${import.meta.env.BASE_URL}Logo.svg")`,
} as CSSProperties;

export default function ArtworkInfo() {
  return (
    <header className="absolute left-4 top-[44px] z-20 flex flex-col items-start text-current md:left-[48px]">
      <div className="flex w-[358px] flex-col gap-2 md:w-[444px]">
        <span
          className="christies-logo"
          role="img"
          aria-label="Christie's"
          style={logoStyle}
        />
        <h1 className="font-serif text-[36px] font-light leading-[1.2] text-current">
          Jackson Pollock
          <br />
          <span className="whitespace-nowrap">(1912-1956)</span>
        </h1>
        <p className="font-sans text-[18px] font-light italic leading-[1.2] text-current">
          Number 7A, 1948
        </p>
      </div>
    </header>
  );
}
