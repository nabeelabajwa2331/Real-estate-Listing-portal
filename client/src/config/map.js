// Central map configuration. Provide a MapTiler key to switch from the default
// OpenStreetMap raster tiles to MapTiler's styled basemaps; otherwise OSM is
// used so the map works with no signup.
const KEY = import.meta.env.VITE_MAPTILER_KEY;
const STYLE = import.meta.env.VITE_MAP_STYLE || 'streets-v2';

export const TILE_URL = KEY
  ? `https://api.maptiler.com/maps/${STYLE}/{z}/{x}/{y}.png?key=${KEY}`
  : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

export const TILE_ATTRIBUTION = KEY
  ? '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const DEFAULT_CENTER = [30.3753, 69.3451]; // centre of Pakistan
export const DEFAULT_ZOOM = 6;
