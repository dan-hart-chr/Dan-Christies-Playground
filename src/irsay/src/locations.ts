export interface Location {
  id: string
  name: string
  shortName: string
  coordinates: [number, number] // [lng, lat]
  description: string
  yearBuilt?: string
  historicalNote?: string
}

export const NYC_LOCATIONS: Location[] = [
  {
    id: 'ed-sullivan',
    name: 'Ed Sullivan Theatre',
    shortName: 'Ed Sullivan',
    coordinates: [-73.982945, 40.763812],
    description: 'Home of The Late Show and the legendary Ed Sullivan Show where The Beatles made their historic American debut on February 9, 1964.',
    yearBuilt: '1927',
    historicalNote: 'CBS Studio 50'
  },
  {
    id: 'cbs-studios',
    name: 'CBS Broadcast Center',
    shortName: 'CBS Studios',
    coordinates: [-73.9897, 40.7686],
    description: 'The CBS Broadcast Center at 524 West 57th Street served as CBS\'s main production facility in New York City for decades.',
    yearBuilt: '1964',
    historicalNote: 'Major broadcast facility'
  },
  {
    id: 'carnegie-hall',
    name: 'Carnegie Hall',
    shortName: 'Carnegie Hall',
    coordinates: [-73.9797, 40.7648],
    description: 'One of the most prestigious concert venues in the world, opened in 1891. Has hosted legendary performances from classical to rock.',
    yearBuilt: '1891',
    historicalNote: 'Built by Andrew Carnegie'
  },
  {
    id: 'rko-theatre',
    name: 'RKO Proctor\'s 58th Street Theatre',
    shortName: 'RKO Theatre',
    coordinates: [-73.9678, 40.7612],
    description: 'The first Atmospheric-style theatre in Manhattan with 3,163 seats. Demolished in 1967 for luxury apartments.',
    yearBuilt: '1929',
    historicalNote: 'Historic site - no longer standing'
  },
  {
    id: 'mannys-music',
    name: 'Manny\'s Music Store',
    shortName: 'Manny\'s Music',
    coordinates: [-73.9855, 40.7596],
    description: 'Legendary music store on 48th Street\'s "Music Row." Served countless rock legends from Hendrix to The Beatles.',
    yearBuilt: '1935',
    historicalNote: 'Originally at 120 W 48th St, later 156 W 48th St'
  },
  {
    id: 'madison-square-garden',
    name: 'Madison Square Garden',
    shortName: 'MSG',
    coordinates: [-73.993324, 40.750298],
    description: 'The world\'s most famous arena. Home to legendary concerts from John Lennon to countless rock icons.',
    yearBuilt: '1968',
    historicalNote: 'Fourth venue to bear the name'
  },
  {
    id: 'christies',
    name: 'Christie\'s Rockefeller Center',
    shortName: 'Christie\'s',
    coordinates: [-73.980099, 40.7586029],
    description: 'Premier auction house at 20 Rockefeller Plaza. Has sold some of the world\'s most valuable musical instruments and memorabilia.',
    yearBuilt: '1766',
    historicalNote: 'At Rockefeller Center since 1997'
  }
]

export function getLocationCenter(): [number, number] {
  const lngs = NYC_LOCATIONS.map(l => l.coordinates[0])
  const lats = NYC_LOCATIONS.map(l => l.coordinates[1])

  const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2
  const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2

  return [centerLng, centerLat]
}

export function formatCoords(coords: [number, number]): string {
  const lat = Math.abs(coords[1]).toFixed(4)
  const lng = Math.abs(coords[0]).toFixed(4)
  const latDir = coords[1] >= 0 ? 'N' : 'S'
  const lngDir = coords[0] >= 0 ? 'E' : 'W'
  return `${lat}°${latDir}, ${lng}°${lngDir}`
}
