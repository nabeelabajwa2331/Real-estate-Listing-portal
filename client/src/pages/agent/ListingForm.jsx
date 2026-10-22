import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errorMessage } from '../../api/axios.js';
import LocationPicker from '../../components/LocationPicker.jsx';
import SmartImage from '../../components/SmartImage.jsx';
import { assetUrl } from '../../config/api.js';

const empty = {
  title: '',
  description: '',
  listingType: 'sale',
  propertyType: 'house',
  price: '',
  currency: 'PKR',
  rentPeriod: 'month',
  bedrooms: '',
  bathrooms: '',
  area: '',
  street: '',
  city: '',
  state: '',
  country: 'Pakistan',
  zip: '',
  amenities: '',
  lat: '',
  lng: '',
};

const MAX_IMAGES = 10;

export default function ListingForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(empty);
  const [existing, setExisting] = useState([]);
  const [removed, setRemoved] = useState([]); // publicIds marked for deletion
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(editing);
  const [geo, setGeo] = useState({ busy: false, error: '', label: '' });

  // Load the listing when editing.
  useEffect(() => {
    if (!editing) return undefined;
    let active = true;
    api
      .get(`/listings/${id}`)
      .then((res) => {
        if (!active) return;
        const l = res.data.listing;
        setForm({
          title: l.title || '',
          description: l.description || '',
          listingType: l.listingType || 'sale',
          propertyType: l.propertyType || 'house',
          price: l.price ?? '',
          currency: l.currency || 'PKR',
          rentPeriod: l.rentPeriod || 'month',
          bedrooms: l.bedrooms ?? '',
          bathrooms: l.bathrooms ?? '',
          area: l.area ?? '',
          street: l.address?.street || '',
          city: l.address?.city || '',
          state: l.address?.state || '',
          country: l.address?.country || 'Pakistan',
          zip: l.address?.zip || '',
          amenities: (l.amenities || []).join(', '),
          lat: l.location?.coordinates?.[1] ?? '',
          lng: l.location?.coordinates?.[0] ?? '',
        });
        setExisting(l.images || []);
      })
      .catch((err) => active && setError(errorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [editing, id]);

  // Object URLs for the new files, revoked when the selection changes.
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  const keptCount = existing.length - removed.length;
  const totalImages = keptCount + files.length;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    if (totalImages + picked.length > MAX_IMAGES) {
      setError(`You can upload up to ${MAX_IMAGES} photos`);
      return;
    }
    setError('');
    setFiles((current) => [...current, ...picked]);
    e.target.value = ''; // lets the same file be picked again if needed
  };

  const removeExisting = (publicId) => setRemoved((r) => [...r, publicId]);
  const undoExisting = (publicId) => setRemoved((r) => r.filter((x) => x !== publicId));

  const locateFromAddress = async () => {
    const query = [form.street, form.city, form.state, form.country, form.zip].filter(Boolean).join(', ');
    if (!query) {
      setGeo({ busy: false, error: 'Fill in the address fields first', label: '' });
      return;
    }

    setGeo({ busy: true, error: '', label: '' });
    try {
      const { data } = await api.get('/geocode', { params: { q: query } });
      setForm((f) => ({ ...f, lat: data.lat.toFixed(6), lng: data.lng.toFixed(6) }));
      setGeo({ busy: false, error: '', label: data.label });
    } catch (err) {
      setGeo({ busy: false, error: errorMessage(err), label: '' });
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => fd.append(key, value));
      removed.forEach((publicId) => fd.append('removeImages', publicId));
      files.forEach((file) => fd.append('images', file));

      if (editing) await api.put(`/listings/${id}`, fd);
      else await api.post('/listings', fd);

      navigate('/agent');
    } catch (err) {
      setError(errorMessage(err));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="muted center">Loading listing...</p>;

  return (
    <form className="card form form-wide" onSubmit={onSubmit}>
      <div className="page-head">
        <h1>{editing ? 'Edit listing' : 'Create a listing'}</h1>
        <Link to="/agent" className="btn btn-ghost">
          Back to dashboard
        </Link>
      </div>

      {error && <p className="alert alert-error">{error}</p>}

      <section className="form-section">
        <h2>Basics</h2>
        <div className="form-grid">
          <label className="span-2">
            Title
            <input name="title" value={form.title} onChange={onChange} required minLength={5} maxLength={120} placeholder="3-bed house in DHA Phase 5" />
          </label>

          <label>
            Listing type
            <select name="listingType" value={form.listingType} onChange={onChange}>
              <option value="sale">For sale</option>
              <option value="rent">For rent</option>
            </select>
          </label>
          <label>
            Property type
            <select name="propertyType" value={form.propertyType} onChange={onChange}>
              <option value="house">House</option>
              <option value="apartment">Apartment</option>
              <option value="plot">Plot</option>
              <option value="commercial">Commercial</option>
              <option value="room">Room</option>
            </select>
          </label>

          <label>
            Price
            <input type="number" name="price" value={form.price} onChange={onChange} required min="0" step="any" placeholder="25000000" />
          </label>
          <label>
            Currency
            <input name="currency" value={form.currency} onChange={onChange} maxLength={6} />
          </label>

          {form.listingType === 'rent' && (
            <label>
              Rent period
              <select name="rentPeriod" value={form.rentPeriod} onChange={onChange}>
                <option value="month">Per month</option>
                <option value="year">Per year</option>
              </select>
            </label>
          )}

          <label>
            Bedrooms
            <input type="number" name="bedrooms" value={form.bedrooms} onChange={onChange} min="0" />
          </label>
          <label>
            Bathrooms
            <input type="number" name="bathrooms" value={form.bathrooms} onChange={onChange} min="0" />
          </label>
          <label>
            Area (sqft)
            <input type="number" name="area" value={form.area} onChange={onChange} min="0" />
          </label>
        </div>
      </section>

      <section className="form-section">
        <h2>Location</h2>
        <div className="form-grid">
          <label className="span-2">
            Street
            <input name="street" value={form.street} onChange={onChange} placeholder="House 12, Street 4" />
          </label>
          <label>
            City
            <input name="city" value={form.city} onChange={onChange} required placeholder="Lahore" />
          </label>
          <label>
            State / Province
            <input name="state" value={form.state} onChange={onChange} placeholder="Punjab" />
          </label>
          <label>
            Country
            <input name="country" value={form.country} onChange={onChange} />
          </label>
          <label>
            ZIP / Postal code
            <input name="zip" value={form.zip} onChange={onChange} />
          </label>
        </div>
      </section>

      <section className="form-section">
        <h2>Map location</h2>
        <p className="muted small">
          Set the pin so this listing appears on the map in search results. This is optional.
        </p>
        <div className="form-grid">
          <label>
            Latitude
            <input name="lat" value={form.lat} onChange={onChange} placeholder="31.5204" />
          </label>
          <label>
            Longitude
            <input name="lng" value={form.lng} onChange={onChange} placeholder="74.3587" />
          </label>
        </div>

        <div className="geo-row">
          <button type="button" className="btn" onClick={locateFromAddress} disabled={geo.busy}>
            {geo.busy ? 'Locating...' : 'Locate from address'}
          </button>
          {geo.error && <span className="geo-msg error">{geo.error}</span>}
          {geo.label && <span className="geo-msg muted">{geo.label}</span>}
        </div>

        <LocationPicker
          lat={form.lat}
          lng={form.lng}
          onChange={(lat, lng) => setForm((f) => ({ ...f, lat: lat.toFixed(6), lng: lng.toFixed(6) }))}
        />
      </section>

      <section className="form-section">
        <h2>Details</h2>
        <div className="form-grid">
          <label className="span-2">
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              required
              minLength={20}
              rows={6}
              placeholder="Describe the property, its condition and what makes it special."
            />
          </label>
          <label className="span-2">
            Amenities <span className="muted">(comma separated)</span>
            <input name="amenities" value={form.amenities} onChange={onChange} placeholder="Parking, Garden, Security, Lift" />
          </label>
        </div>
      </section>

      <section className="form-section">
        <h2>Photos</h2>
        <p className="muted small">
          Upload up to {MAX_IMAGES} images. The first one is used as the cover. ({totalImages}/{MAX_IMAGES} selected)
        </p>

        {existing.length > 0 && (
          <div className="photo-grid">
            {existing.map((img) => {
              const isRemoved = removed.includes(img.publicId);
              return (
                <div key={img.publicId || img.url} className={isRemoved ? 'photo removed' : 'photo'}>
                  <SmartImage src={assetUrl(img.url)} alt="Listing" loading="lazy" />
                  {isRemoved ? (
                    <button type="button" className="photo-action" onClick={() => undoExisting(img.publicId)}>
                      Undo
                    </button>
                  ) : (
                    <button type="button" className="photo-action" onClick={() => removeExisting(img.publicId)}>
                      Remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {previews.length > 0 && (
          <div className="photo-grid">
            {previews.map((preview, index) => (
              <div key={preview.url} className="photo">
                <img src={preview.url} alt="New upload" />
                <button type="button" className="photo-action" onClick={() => setFiles((f) => f.filter((_, i) => i !== index))}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <label className="file-drop">
          <input type="file" accept="image/*" multiple onChange={onFiles} disabled={totalImages >= MAX_IMAGES} />
          <span>{totalImages >= MAX_IMAGES ? 'Maximum photos reached' : 'Click to add photos'}</span>
        </label>
      </section>

      <div className="form-actions">
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Saving...' : editing ? 'Save changes' : 'Publish listing'}
        </button>
        <Link to="/agent" className="btn">
          Cancel
        </Link>
      </div>
    </form>
  );
}
