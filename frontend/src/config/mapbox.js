export const mapboxAccessToken = [
  import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN,
  import.meta.env.VITE_MAPBOX_TOKEN,
  import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
]
  .find((value) => typeof value === 'string' && value.trim())
  ?.trim() || ''

export const hasMapboxPublicToken = mapboxAccessToken.startsWith('pk.')

export const openStreetMapRasterStyle = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
    },
  ],
}

export function resolveMapStyle(accessToken = mapboxAccessToken) {
  return accessToken.startsWith('pk.') ? 'mapbox://styles/mapbox/streets-v12' : openStreetMapRasterStyle
}
