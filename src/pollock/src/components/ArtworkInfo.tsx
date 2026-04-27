export default function ArtworkInfo() {
  return (
    <header className="absolute left-4 top-[44px] z-20 flex flex-col items-start md:left-[48px]">
      <div className="flex w-[358px] flex-col gap-2 md:w-[444px]">
        <h1 className="font-serif text-[36px] font-light leading-[1.2] text-[#222]">
          Jackson Pollock
          <br />
          <span className="whitespace-nowrap">(1912-1956)</span>
        </h1>
        <p className="font-sans text-[18px] font-light italic leading-[1.2] text-[#222]">
          7a, 1948
        </p>
      </div>
    </header>
  );
}
