import LocationSection from "./location-section";

const mainText = `The Steinway piano Elton John used for years of performances, including his historic November 28, 1974 Thanksgiving concert at Madison Square Garden where John Lennon made a surprise guest appearance—performing "Whatever Gets You Thru the Night," "Lucy in the Sky with Diamonds," and "I Saw Her Standing There" in what would be his final public performance.`;
const bottomText = `This intimate moment, captured on this very instrument, represents one of rock's most poignant footnotes—the last time the world would see a Beatle perform live. John had agreed to join Elton onstage if "Whatever Gets You Thru the Night" hit number one, and he kept his word, creating an unforgettable evening at the Garden.`;

export default function MadisonSquareGardenSection() {
  return (
    <LocationSection
      location="MADISON_SQUARE_GARDEN"
      title={{ main: "MADISON SQUARE", sub: "GARDEN" }}
      mainText={mainText}
      bottomText={bottomText}
      imageClassName="dylan-title-section__image--msg"
    />
  );
}
