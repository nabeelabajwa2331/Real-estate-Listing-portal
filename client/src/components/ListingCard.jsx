import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useFavorites } from '../context/FavoritesContext.jsx';

export const propertyLabel = {
  house: 'House',
  apartment: 'Apartment',
  plot: 'Plot',
  commercial: 'Commercial',
  room: 'Room',
};

export function formatPrice(listing) {
  const amount = new Intl.NumberFormat('en-US').format(listing.price || 0);
  const suffix = listing.listingType === 'rent' ? ` / ${listing.rentPeriod || 'month'}` : '';
  return `${listing.currency || 'PKR'} ${amount}${suffix}`;
}

export default function ListingCard({ listing }) {
  const { user } = useAuth();
  const favorites = useFavorites();
  const saved = Boolean(user && favorites?.isFavorite(listing._id));

  const cover = listing.images?.[0]?.url;
  const city = listing.address?.city;

  const onToggleFavorite = (e) => {
    // The whole card is a link, so stop the click from navigating.
    e.preventDefault();
    e.stopPropagation();
    favorites.toggle(listing._id);
  };

  return (
    <Link to={`/listings/${listing._id}`} className="listing-card">
      <div className="listing-card-media">
        {cover ? (
          <img src={cover} alt={listing.title} loading="lazy" />
        ) : (
          <span className="listing-card-empty">No photo</span>
        )}
        <span className={`tag tag-${listing.listingType}`}>
          {listing.listingType === 'rent' ? 'For rent' : 'For sale'}
        </span>
        {user && (
          <button
            type="button"
            className={saved ? 'fav-btn active' : 'fav-btn'}
            onClick={onToggleFavorite}
            aria-label={saved ? 'Remove from favorites' : 'Save to favorites'}
            aria-pressed={saved}
          >
            {saved ? '♥' : '♡'}
          </button>
        )}
      </div>

      <div className="listing-card-body">
        <h3>{listing.title}</h3>
        {city && <p className="muted small">{city}</p>}

        <div className="listing-card-meta">
          <span>{propertyLabel[listing.propertyType] || listing.propertyType}</span>
          {listing.bedrooms > 0 && <span>{listing.bedrooms} bd</span>}
          {listing.bathrooms > 0 && <span>{listing.bathrooms} ba</span>}
          {listing.area > 0 && <span>{listing.area} sqft</span>}
        </div>

        <p className="listing-card-price">{formatPrice(listing)}</p>
      </div>
    </Link>
  );
}
