import mapboxgl from 'mapbox-gl'
import { getMap } from './map'
import { NYC_LOCATIONS } from './locations'

const ROUTE_SOURCE_ID = 'route-to-christies'
const ROUTE_LAYER_ID = 'route-to-christies-line'
const ROUTE_LABEL_SOURCE_ID = 'route-label-source'
const ROUTE_LABEL_LAYER_ID = 'route-label-layer'

// Christie's coordinates
const CHRISTIES_COORDS: [number, number] = [-73.980099, 40.7586029]

interface RouteGeometry {
  type: 'LineString'
  coordinates: [number, number][]
}

interface RouteData {
  geometry: RouteGeometry
  duration: number // in seconds
}

/**
 * Format duration in minutes
 */
function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60)
  return `${minutes} min walk`
}

/**
 * Get midpoint of a line
 */
function getMidpoint(coordinates: [number, number][]): [number, number] {
  if (coordinates.length === 0) {
    return [0, 0]
  }
  const midIndex = Math.floor(coordinates.length / 2)
  const point = coordinates[midIndex]
  return point ?? coordinates[0] ?? [0, 0]
}

/**
 * Fetch route from Mapbox Directions API
 */
async function fetchRoute(
  from: [number, number],
  to: [number, number]
): Promise<RouteData | null> {
  const accessToken = mapboxgl.accessToken

  if (!accessToken) {
    console.error('Mapbox access token not set')
    return null
  }

  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${from[0]},${from[1]};${to[0]},${to[1]}?geometries=geojson&overview=full&access_token=${accessToken}`

  try {
    const response = await fetch(url)
    const data = await response.json()

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      console.error('No route found:', data)
      return null
    }

    return {
      geometry: data.routes[0].geometry as RouteGeometry,
      duration: data.routes[0].duration as number
    }
  } catch (error) {
    console.error('Error fetching route:', error)
    return null
  }
}

/**
 * Show route from a location to Christie's
 */
export async function showRouteToChristies(locationId: string): Promise<void> {
  const map = getMap()
  if (!map) {
    console.error('Map not available')
    return
  }

  // Find the location
  const location = NYC_LOCATIONS.find(l => l.id === locationId)
  if (!location) {
    console.error('Location not found:', locationId)
    return
  }

  // Don't show route if already at Christie's
  if (locationId === 'christies') {
    return
  }

  const fromCoords: [number, number] = [location.coordinates[0], location.coordinates[1]]

  // Fetch the route
  const routeData = await fetchRoute(fromCoords, CHRISTIES_COORDS)
  if (!routeData) {
    return
  }

  // Remove existing route if any
  hideRoute()

  // Add route source
  map.addSource(ROUTE_SOURCE_ID, {
    type: 'geojson',
    data: {
      type: 'Feature',
      properties: {},
      geometry: routeData.geometry
    }
  })

  // Add label source at midpoint
  const midpoint = getMidpoint(routeData.geometry.coordinates)
  map.addSource(ROUTE_LABEL_SOURCE_ID, {
    type: 'geojson',
    data: {
      type: 'Feature',
      properties: {
        label: formatDuration(routeData.duration)
      },
      geometry: {
        type: 'Point',
        coordinates: midpoint
      }
    }
  })

  // Find the first marker layer to insert route below it
  const markerLayerId = map.getLayer('location-markers-outer-glow')
    ? 'location-markers-outer-glow'
    : undefined

  // Add glow layer (wider, blurred underneath) - below markers
  map.addLayer({
    id: ROUTE_LAYER_ID + '-glow',
    type: 'line',
    source: ROUTE_SOURCE_ID,
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#ff4444',
      'line-width': 16,
      'line-opacity': 0.6,
      'line-blur': 6,
      'line-emissive-strength': 1
    }
  }, markerLayerId)

  // Add main route layer - red glowing line - below markers
  map.addLayer({
    id: ROUTE_LAYER_ID,
    type: 'line',
    source: ROUTE_SOURCE_ID,
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#ff2222',
      'line-width': 5,
      'line-opacity': 1,
      'line-emissive-strength': 1
    }
  }, markerLayerId)

  // Add walking time label at midpoint
  map.addLayer({
    id: ROUTE_LABEL_LAYER_ID,
    type: 'symbol',
    source: ROUTE_LABEL_SOURCE_ID,
    layout: {
      'text-field': ['get', 'label'],
      'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
      'text-size': 14,
      'text-anchor': 'center',
      'text-offset': [0, 0]
    },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': '#ff2222',
      'text-halo-width': 2,
      'text-halo-blur': 1,
      'text-emissive-strength': 1
    }
  })
}

/**
 * Hide/remove the route from the map
 */
export function hideRoute(): void {
  const map = getMap()
  if (!map) return

  // Remove layers first, then sources
  if (map.getLayer(ROUTE_LABEL_LAYER_ID)) {
    map.removeLayer(ROUTE_LABEL_LAYER_ID)
  }

  if (map.getLayer(ROUTE_LAYER_ID)) {
    map.removeLayer(ROUTE_LAYER_ID)
  }

  if (map.getLayer(ROUTE_LAYER_ID + '-glow')) {
    map.removeLayer(ROUTE_LAYER_ID + '-glow')
  }

  if (map.getSource(ROUTE_LABEL_SOURCE_ID)) {
    map.removeSource(ROUTE_LABEL_SOURCE_ID)
  }

  if (map.getSource(ROUTE_SOURCE_ID)) {
    map.removeSource(ROUTE_SOURCE_ID)
  }
}
