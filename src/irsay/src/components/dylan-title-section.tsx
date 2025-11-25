import LocationSection from "./location-section";

const mainText = `The solid-body Fender Stratocaster Electric Guitar that Bob Dylan used for his fifth studio album Bringing It All Back Home, recorded at CBS Studios, New York, 13-15 January 1966. Conceivable that it was also used in the October 1965 sessions in New York for Blonde on Blonde.`;
const bottomText = `On July 25, 1965, Dylan shocked the folk world at the Newport Folk Festival when he took the stage with this Stratocaster, backed by members of the Paul Butterfield Blues Band. Opening with an electrified "Maggie's Farm" followed by "Like a Rolling Stone," the performance met with both boos and cheers—a pivotal moment that forever changed the trajectory of both folk and rock music.`;

export default function DylanTitleSection() {
  return (
    <LocationSection
      location="CBS_STUDIOS"
      title={{ main: "Bringing It All", sub: "Back Home" }}
      mainText={mainText}
      bottomText={bottomText}
      imageClassName="dylan-title-section__image--dylan"
    />
  );
}
