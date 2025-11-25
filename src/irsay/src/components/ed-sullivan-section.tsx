import LocationSection from "./location-section";

const title = { main: "ED SULLIVAN", sub: "THEATRE" };
const mainText = `The drumhead used on Ringo Starr's drum kit for The Beatles' 9 February 1964 debut performance on The Ed Sullivan Show.`;
const bottomText = `Historically it was the most important performance of The Beatles' careers. Beatlemania began in the US that evening, permanently changing not only music but pop culture. Starr didn't bring his entire drum kit from London to the US, only a few pieces of his kit along with this drumhead.`;

export default function EdSullivanSection() {
  return (
    <LocationSection
      location="ED_SULLIVAN_THEATRE"
      title={title}
      mainText={mainText}
      bottomText={bottomText}
      videoUrl="https://player.vimeo.com/external/1131335498.m3u8?s=d49b40eab08de3193239375c38480b419c0589e7&logging=false"
    />
  );
}
