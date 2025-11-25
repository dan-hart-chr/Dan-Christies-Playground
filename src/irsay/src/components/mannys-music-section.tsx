import LocationSection from "./location-section";

const mainText = `The solid-body Fender Stratocaster Electric Guitar that Bob Dylan used for his fifth studio album MANNY'S MUSIC Back Home, recorded at CBS Studios, New York, 13-15 January 1966. Conceivable that it was also used in the October 1965 sessions in New York for Blonde on Blonde.`;
const bottomText = `The solid-body Fender Stratocaster Electric Guitar that Bob Dylan used for his fifth studio album MANNY'S MUSIC Back Home, recorded at CBS Studios, New York, 13-15 January 1966. Conceivable that it was also used in the October 1965 sessions in New York for Blonde on Blonde.`;

export default function MannysMusicSection() {
  return (
    <LocationSection
      location="MANNYS_MUSIC"
      title="MANNY'S MUSIC"
      mainText={mainText}
      bottomText={bottomText}
      imageClassName="dylan-title-section__image--mannys"
    />
  );
}
