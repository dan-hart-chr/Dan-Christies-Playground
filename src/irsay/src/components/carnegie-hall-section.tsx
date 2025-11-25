import LocationSection from "./location-section";

const mainText = `George Harrison's 1964 SG Standard guitar played from 1966 through 1969 during various Beatles appearances and recording sessions at Carnegie Hall.`;
const bottomText = `This cherry red Gibson SG with Maestro Vibrola was Harrison's main guitar during the Beatles' final tours in 1966, and featured prominently in promotional videos for "Paperback Writer," "Rain," and "Lady Madonna." In 1969, Harrison gave the guitar to Pete Ham, lead guitarist of Badfinger, before it was acquired by Jim Irsay at Christie's in 2004 for $567,000.`;

export default function CarnegieHallSection() {
  return (
    <LocationSection
      location="CARNEGIE_HALL"
      title="CARNEGIE HALL"
      mainText={mainText}
      bottomText={bottomText}
      imageClassName="dylan-title-section__image--carnegie"
    />
  );
}
