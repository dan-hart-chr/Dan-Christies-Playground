import type { Coordinates } from "@/types/animations";

export function calculateDistance(from: Coordinates, to: Coordinates): string {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Convert to miles
  const miles = distance * 0.621371;

  return `${miles.toFixed(1)} miles`;
}

export function getWalkingTimeText(from: Coordinates, to: Coordinates): string {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Convert to miles
  const miles = distance * 0.621371;

  // Average walking speed is 3 mph
  const walkingTime = (miles / 3) * 60; // minutes

  if (walkingTime < 1) {
    return "Less than 1 minute walk";
  } else if (walkingTime < 60) {
    return `${Math.round(walkingTime)} minute walk`;
  } else {
    const hours = Math.floor(walkingTime / 60);
    const minutes = Math.round(walkingTime % 60);
    return minutes > 0
      ? `${hours} hour ${minutes} minute walk`
      : `${hours} hour walk`;
  }
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
