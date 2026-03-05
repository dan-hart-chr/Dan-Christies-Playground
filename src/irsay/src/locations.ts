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
    id: 'mannys-music',
    name: 'Manny\'s Music Store',
    shortName: 'Manny\'s',
    coordinates: [-73.9855, 40.7596],
    description: 'David Gilmour bought The Black Strat here — the Fender Stratocaster that would become one of the most iconic guitars in rock history.',
    yearBuilt: '1935',
    historicalNote: 'Originally at 120 W 48th St, later 156 W 48th St'
  },
  {
    id: 'rko-theatre',
    name: 'RKO Theatre',
    shortName: 'RKO Theatre',
    coordinates: [-73.9678, 40.7612],
    description: 'Cream had its debut appearance here with The Fool — Eric Clapton\'s psychedelic painted Gibson SG Standard guitar.',
    yearBuilt: '1929',
    historicalNote: 'Historic site - no longer standing'
  },
  {
    id: 'carnegie-hall',
    name: 'Carnegie Hall',
    shortName: 'Carnegie Hall',
    coordinates: [-73.9797, 40.7648],
    description: 'The Ed Sullivan drum head was played here when the Beatles toured in Feb-March 1964, and Bob Dylan\'s "The Times They Are A Changin\'" was recorded here.',
    yearBuilt: '1891',
    historicalNote: 'Built by Andrew Carnegie'
  },
  {
    id: 'madison-square-garden',
    name: 'Madison Square Garden',
    shortName: 'MSG',
    coordinates: [-73.993324, 40.750298],
    description: 'Janis Joplin played her Gibson J-45 here to rapturous applause performing \'Me & Bobby McGee\' in December 1969.',
    yearBuilt: '1968',
    historicalNote: 'Fourth venue to bear the name'
  },
  {
    id: 'shea-stadium',
    name: 'Shea Stadium',
    shortName: 'Shea Stadium',
    coordinates: [-73.8458, 40.7571],
    description: 'Home of The Beatles\' legendary 1965 concert — the Collection includes the stadium\'s umpire locker and original concert tickets.',
    yearBuilt: '1964',
    historicalNote: 'Demolished 2009, now Citi Field'
  },
  {
    id: 'town-hall',
    name: 'New York Town Hall',
    shortName: 'Town Hall',
    coordinates: [-73.9838, 40.7567],
    description: 'Bob Dylan\'s first solo concert took place here on 12 April 1963 — the only known example of the small format handbill from this event is in the Collection.',
    yearBuilt: '1921',
    historicalNote: '123 West 43rd Street'
  },
  {
    id: 'radio-city',
    name: 'Radio City Music Hall',
    shortName: 'Radio City',
    coordinates: [-73.9812, 40.7608],
    description: 'Lou Reed performed with Goldie for the concert tribute "Come Together: A Night for John Lennon\'s Words and Music" broadcast live on TNT, 2 October 2001.',
    yearBuilt: '1932',
    historicalNote: '1260 Avenue of the Americas'
  },
  {
    id: 'hendrix-apartment',
    name: '59 West 12th Street',
    shortName: '59 W 12th St',
    coordinates: [-73.9975, 40.7348],
    description: 'Jimi Hendrix\'s apartment where he kept his Moroccan chest used to store demo tapes — an intimate piece of rock history.',
    yearBuilt: '1900',
    historicalNote: 'Greenwich Village, Manhattan'
  },
  {
    id: 'apollo-theatre',
    name: 'Apollo Theatre',
    shortName: 'Apollo',
    coordinates: [-73.9499, 40.8099],
    description: 'James Brown wore his legendary sequinned "Godfather of Soul" stage cape at a free concert here in 2003.',
    yearBuilt: '1914',
    historicalNote: '253 West 125th Street, Harlem'
  },
  {
    id: 'belmont-park',
    name: 'Belmont Park',
    shortName: 'Belmont Park',
    coordinates: [-73.7185, 40.6722],
    description: 'Secretariat raced to victory here wearing his saddle in the Belmont Stakes in 1973, completing the Triple Crown in record time.',
    yearBuilt: '1905',
    historicalNote: 'Elmont, Long Island'
  },
  {
    id: 'nassau-coliseum',
    name: 'Nassau Coliseum',
    shortName: 'Nassau',
    coordinates: [-73.5906, 40.7246],
    description: 'Neal Schon performed with Journey on his Gibson Les Paul Pro Deluxe here in 1981, used to record the hit single "Don\'t Stop Believin\'".',
    yearBuilt: '1972',
    historicalNote: 'Uniondale, Long Island'
  },
  {
    id: 'christies',
    name: 'Christie\'s Rockefeller Center',
    shortName: 'Christie\'s',
    coordinates: [-73.980099, 40.7586029],
    description: 'Premier auction house at 20 Rockefeller Plaza. Home of the Icons of Pop sale featuring these legendary instruments and artifacts.',
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
