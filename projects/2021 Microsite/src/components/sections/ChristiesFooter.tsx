"use client";
/**
 * Christie's Footer — new "Browse every category" section (Figma node 15:3288 / 11:3104).
 *
 * Scope: structure only. The Figma source itself still has unfinished
 * Webflow-template placeholder copy ("A Webflow template crafted for
 * forward-thinking companies...", generic "DEPARTMENT" / "Category name"
 * labels) — carried over verbatim here pending real copy.
 *
 * Token substitutions applied:
 *   Fonts:  ABC Arizona Flare (Light) → ABCArizonaFlare
 *           ABC Arizona Sans (Light)  → ABCArizonaSans
 *   Colors: heading/body → #FFFFFF (colors.white), over a 35% black scrim
 *           link panel bg → rgba(240,232,215,0.95) (colors.brand-cream @ 95%)
 *           link heading  → #000000 (colors.black)
 *           link text     → #333333 (colors.black-80)
 */

import * as React from 'react';

const imgBackgroundFooter = 'https://www.figma.com/api/mcp/asset/df0d9680-8b25-4661-b22f-b0b4dca7faa3.png';

const DEPARTMENTS = [
  { name: 'DEPARTMENT', links: ['Category name', 'Category name', 'Category name'] },
  { name: 'DEPARTMENT', links: ['Category name', 'Category name', 'Category name'] },
  { name: 'DEPARTMENT', links: ['Category name', 'Category name', 'Category name'] },
  { name: 'DEPARTMENT', links: ['Category name', 'Category name', 'Category name'] },
];

const tokens = {
  textColor: '#FFFFFF', // colors.white
  panelBg: 'rgba(240, 232, 215, 0.95)', // colors.brand-cream @ 95%
  linkHeading: '#000000', // colors.black
  linkText: '#333333', // colors.black-80

  fontFlare: 'var(--font-family-arizona-flare)',
  fontSans: 'var(--font-family-arizona-sans)',
};

export function ChristiesFooter() {
  return (
    <footer className="christies-footer w-full px-6 pb-6 max-[767px]:px-3 max-[767px]:pb-3" style={{ backgroundColor: '#5D5D5D' }}>
      <div
        className="relative w-full max-w-[1392px] mx-auto rounded-[24px] px-10 py-[60px] flex flex-col gap-12 overflow-hidden max-[767px]:px-6 max-[767px]:py-9"
        style={{
          backgroundColor: '#5D5D5D',
          backgroundImage: `url(${imgBackgroundFooter})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-[rgba(0,0,0,0.35)] rounded-[24px]" />
        <div className="relative z-10 flex flex-col gap-6 max-w-[603px]">
          <p className="m-0" style={{ fontFamily: tokens.fontFlare, fontWeight: 100, fontSize: '3.75rem', lineHeight: '1.067', color: tokens.textColor }}>
            Browse every category
          </p>
          <p className="m-0" style={{ fontFamily: tokens.fontSans, fontWeight: 300, fontSize: '1rem', lineHeight: '1.4', color: tokens.textColor }}>
            A Webflow template crafted for forward-thinking companies and businesses who value clarity, warmth, and adaptability.
          </p>
        </div>

        <div
          className="relative z-10 rounded-2xl px-8 pt-12 pb-12 flex gap-4 max-[767px]:flex-col max-[767px]:gap-9"
          style={{ backgroundColor: tokens.panelBg, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        >
          {DEPARTMENTS.map((dept, i) => (
            <div key={i} className="flex flex-col gap-5 flex-1 min-w-0">
              <p
                className="m-0 uppercase"
                style={{ fontFamily: tokens.fontFlare, fontWeight: 300, fontSize: '1.25rem', lineHeight: '1.056', letterSpacing: '0.1875rem', color: tokens.linkHeading }}
              >
                {dept.name}
              </p>
              <div className="flex flex-col gap-1">
                {dept.links.map((link, j) => (
                  <p key={j} className="m-0" style={{ fontFamily: tokens.fontSans, fontWeight: 300, fontSize: '1rem', lineHeight: '1.4', color: tokens.linkText }}>
                    {link}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default ChristiesFooter;
