// Proxies forward-geocoding to Nominatim. Keeping this on the server lets us
// send a descriptive User-Agent (which Nominatim asks for) and apply a rate
// limit, and it keeps the third-party call out of the browser.
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

// GET /api/geocode?q=...
export const geocode = async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 3) {
    return res.status(400).json({ message: 'Enter an address to search for' });
  }

  const params = new URLSearchParams({ q, format: 'json', limit: '1', addressdetails: '0' });

  try {
    const response = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: {
        'User-Agent': process.env.GEOCODE_USER_AGENT || 'real-estate-app/1.0 (development)',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(502).json({ message: 'Address lookup failed. Please try again' });
    }

    const results = await response.json();
    if (!results.length) {
      return res.status(404).json({ message: 'No location found for that address' });
    }

    const first = results[0];
    res.json({ lat: Number(first.lat), lng: Number(first.lon), label: first.display_name });
  } catch (err) {
    console.error('Geocoding failed:', err.message);
    res.status(502).json({ message: 'Address lookup failed. Please try again' });
  }
};
