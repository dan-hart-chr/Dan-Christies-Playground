import LocationSection from "./location-section";

const mainText = `Eric Clapton's iconic 1964 Gibson SG, custom painted by Dutch art collective The Fool in a vibrant psychedelic finish, made its U.S. debut when Cream played their first American show at the RKO Theatre on 58th Street, Manhattan on March 25, 1967.`;
const bottomText = `This legendary instrument witnessed rock history that night at the RKO, as Cream—featuring Clapton, Jack Bruce, and Ginger Baker—introduced their revolutionary blues-rock sound to American audiences. The guitar was acquired by Jim Irsay in November 2023 for $1.27 million, setting an auction record for a Clapton guitar.`;

export default function RKOTheatreSection() {
  return (
    <LocationSection
      location="RKO_THEATRE"
      title="RKO THEATRE"
      mainText={mainText}
      bottomText={bottomText}
      imageClassName="dylan-title-section__image--rko"
    />
  );
}
