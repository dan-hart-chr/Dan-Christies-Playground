"use client";
/**
 * Christie's Auctions — new "Upcoming auctions" list section (Figma node 15:3287 / 11:3139).
 *
 * Scope: the simple 3-row list only — the large hidden "Lot Info" detail panel
 * nested in the same Figma frame (full bid/estimate/registration breakdown) is
 * a separate expanded/selected state and is intentionally not built here.
 *
 * This is the first light-on-dark (cream card) section in the page — sits as
 * a rounded #f7f7f7 card floating on the black page background.
 *
 * Thumbnails are placeholder stock images pending real Christie's lot photography.
 *
 * Token substitutions applied:
 *   Fonts:  ABC Arizona Flare (Light) → ABCArizonaFlare
 *           ABC Arizona Serif (Light) → ABCArizonaSerif
 *           ABC Arizona Sans (Medium) → ABCArizonaSans
 *   Colors: card bg     → #F7F7F7 (colors.grey-10)
 *           title/date  → #222222 (colors.primary-black)
 *           meta text   → #666666 (colors.black-60)
 *           live flag   → #960000 (colors.brand-c-red)
 *           closing flag→ #000000 (colors.black)
 *           open flag   → #6E6259 (colors.brand-grey), outline only
 */

import * as React from 'react';

type FlagVariant = 'live' | 'closing' | 'open';

type Auction = {
  day: string;
  month: string;
  title: string;
  location: string;
  thumbnail: string;
  flag: { variant: FlagVariant; label: string };
};

const AUCTIONS: Auction[] = [
  {
    day: '12',
    month: 'JUL',
    title: 'Fine & Rare Wine',
    location: 'NEW YORK',
    thumbnail: 'https://byqsupply-components.netlify.app/evermind/images/TestimonialImage.webp',
    flag: { variant: 'live', label: 'LIVE NOW' },
  },
  {
    day: '13',
    month: 'JUL',
    title: 'Important Watches',
    location: 'NEW YORK',
    thumbnail: 'https://byqsupply-components.netlify.app/evermind/images/FeatureImage.webp',
    flag: { variant: 'closing', label: 'CLOSING SOON' },
  },
  {
    day: '23-6',
    month: 'SEP-OCT',
    title: 'The Stream Family Collection',
    location: 'HONG KONG',
    thumbnail: 'https://byqsupply-components.netlify.app/evermind/images/MarqueeCube.webp',
    flag: { variant: 'open', label: 'OPEN FOR BIDDING' },
  },
];

const tokens = {
  cardBg: '#F7F7F7', // colors.grey-10
  titleColor: '#222222', // colors.primary-black
  metaColor: '#666666', // colors.black-60
  dividerColor: '#EBEBEB', // colors.grey-20

  fontFlare: 'var(--font-family-arizona-flare)',
  fontSerif: 'var(--font-family-arizona-serif)',
  fontSans: 'var(--font-family-arizona-sans)',
};

const FLAG_STYLES: Record<FlagVariant, React.CSSProperties> = {
  live: { backgroundColor: '#960000', color: '#FFFFFF' }, // colors.brand-c-red
  closing: { backgroundColor: '#000000', color: '#FFFFFF' }, // colors.black
  open: { backgroundColor: 'transparent', color: '#6E6259', border: '1px solid #6E6259' }, // colors.brand-grey
};

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.33 8h9.34M8.67 3.67 13 8l-4.33 4.33" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AuctionRow({ auction, showDivider }: { auction: Auction; showDivider: boolean }) {
  return (
    <div style={{ borderTop: showDivider ? `1px solid ${tokens.dividerColor}` : 'none' }}>
      <div className="flex items-center gap-12 py-6 max-[767px]:flex-wrap max-[767px]:gap-4 max-[479px]:gap-2">
        <div className="w-[114px] h-[71px] rounded shrink-0 overflow-hidden max-[479px]:w-[80px] max-[479px]:h-[50px]">
          <img src={auction.thumbnail} loading="lazy" alt="" className="w-full h-full object-cover" />
        </div>

        <div className="flex flex-col gap-3 items-start shrink-0 w-[54px] max-[479px]:w-12">
          <p className="m-0" style={{ fontFamily: tokens.fontSerif, fontWeight: 300, fontSize: `clamp(18px, 3vw, 24px)`, lineHeight: '1.2', color: tokens.titleColor }}>
            {auction.day}
          </p>
          <p className="m-0 uppercase" style={{ fontFamily: tokens.fontSans, fontWeight: 500, fontSize: `clamp(12px, 1.5vw, 12px)`, lineHeight: '1.2', color: tokens.metaColor }}>
            {auction.month}
          </p>
        </div>

        <div className="flex flex-col gap-3 items-start flex-1 min-w-0">
          <p className="m-0 truncate w-full" style={{ fontFamily: tokens.fontFlare, fontWeight: 300, fontSize: `clamp(16px, 3vw, 28px)`, lineHeight: '1.2', color: tokens.titleColor }}>
            {auction.title}
          </p>
          <p className="m-0 uppercase" style={{ fontFamily: tokens.fontSans, fontWeight: 500, fontSize: `clamp(12px, 1.5vw, 12px)`, lineHeight: '1.2', color: tokens.metaColor }}>
            {auction.location}
          </p>
        </div>

        <div
          className="px-4 py-2 rounded shrink-0 uppercase text-nowrap"
          style={{ ...FLAG_STYLES[auction.flag.variant], fontFamily: tokens.fontSans, fontWeight: 500, fontSize: `clamp(11px, 1.5vw, 12px)`, lineHeight: '1.2' }}
        >
          {auction.flag.label}
        </div>
      </div>
    </div>
  );
}

export function ChristiesAuctions() {
  return (
    <section className="christies-auctions w-full px-6 pt-[60px] pb-6 max-[767px]:px-3 max-[767px]:pt-9 max-[767px]:pb-3" style={{ backgroundColor: '#5D5D5D' }}>
      <div
        className="w-full max-w-[1392px] mx-auto rounded-[24px] px-12 py-[60px] max-[767px]:px-6 max-[767px]:py-9"
        style={{ backgroundColor: tokens.cardBg }}
      >
        <div className="flex items-center justify-between mb-6 max-[479px]:flex-col max-[479px]:items-start max-[479px]:gap-3">
          <p className="m-0" style={{ fontFamily: tokens.fontFlare, fontWeight: 300, fontSize: `clamp(20px, 4vw, 32px)`, lineHeight: '1.2', color: tokens.titleColor }}>
            Upcoming auctions
          </p>
          <a
            href="#"
            className="flex items-center gap-4 no-underline"
            style={{ fontFamily: tokens.fontFlare, fontWeight: 300, fontSize: `clamp(16px, 3vw, 20px)`, lineHeight: '1.2', color: tokens.titleColor }}
          >
            View auction calendar
            <ArrowRightIcon />
          </a>
        </div>

        <div>
          {AUCTIONS.map((auction, i) => (
            <AuctionRow key={auction.title} auction={auction} showDivider={i > 0} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default ChristiesAuctions;
