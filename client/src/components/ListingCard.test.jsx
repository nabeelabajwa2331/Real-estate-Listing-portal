import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ListingCard, { formatPrice } from './ListingCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFavorites } from '../context/FavoritesContext.jsx';

vi.mock('../context/AuthContext.jsx', () => ({ useAuth: vi.fn() }));
vi.mock('../context/FavoritesContext.jsx', () => ({ useFavorites: vi.fn() }));

const listing = {
  _id: 'l1',
  title: 'Sunny family house',
  price: 25000000,
  currency: 'PKR',
  listingType: 'sale',
  propertyType: 'house',
  bedrooms: 4,
  bathrooms: 3,
  area: 2200,
  address: { city: 'Lahore' },
  images: [{ url: 'https://cdn.example.com/house.jpg' }],
};

const renderCard = (props = {}) =>
  render(
    <MemoryRouter>
      <ListingCard listing={{ ...listing, ...props }} />
    </MemoryRouter>
  );

const favoritesMock = (overrides = {}) => ({
  isFavorite: () => false,
  toggle: vi.fn(() => Promise.resolve(true)),
  ...overrides,
});

describe('formatPrice', () => {
  it('formats sale prices with the currency', () => {
    expect(formatPrice({ price: 1500000, currency: 'PKR', listingType: 'sale' })).toBe('PKR 1,500,000');
  });

  it('adds the rent period for rentals and defaults to month', () => {
    expect(formatPrice({ price: 50000, listingType: 'rent' })).toBe('PKR 50,000 / month');
    expect(formatPrice({ price: 900, currency: 'USD', listingType: 'rent', rentPeriod: 'week' })).toBe(
      'USD 900 / week'
    );
  });
});

describe('ListingCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: null });
    useFavorites.mockReturnValue(favoritesMock());
  });

  it('links to the listing and shows its key details', () => {
    renderCard();

    expect(screen.getByRole('link').getAttribute('href')).toBe('/listings/l1');
    expect(screen.getByRole('heading', { name: 'Sunny family house' })).toBeTruthy();
    expect(screen.getByText('Lahore')).toBeTruthy();
    expect(screen.getByText('House')).toBeTruthy();
    expect(screen.getByText('4 bd')).toBeTruthy();
    expect(screen.getByText('3 ba')).toBeTruthy();
    expect(screen.getByText('2200 sqft')).toBeTruthy();
    expect(screen.getByText('PKR 25,000,000')).toBeTruthy();
    expect(screen.getByText('For sale')).toBeTruthy();
  });

  it('hides empty specs and labels rentals', () => {
    renderCard({ listingType: 'rent', bedrooms: 0, bathrooms: 0, area: 0, propertyType: 'plot' });

    expect(screen.getByText('For rent')).toBeTruthy();
    expect(screen.getByText('Plot')).toBeTruthy();
    expect(screen.queryByText(/bd$/)).toBeNull();
    expect(screen.queryByText(/sqft$/)).toBeNull();
  });

  it('does not offer a save button to guests', () => {
    renderCard();
    expect(screen.queryByRole('button', { name: /favorites/i })).toBeNull();
  });

  it('reflects the saved state for signed-in users', () => {
    useAuth.mockReturnValue({ user: { id: 'u1' } });
    useFavorites.mockReturnValue(favoritesMock({ isFavorite: (id) => id === 'l1' }));
    renderCard();

    const button = screen.getByRole('button', { name: 'Remove from favorites' });
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('toggles the favorite without following the card link', async () => {
    const user = userEvent.setup();
    const favorites = favoritesMock();
    useAuth.mockReturnValue({ user: { id: 'u1' } });
    useFavorites.mockReturnValue(favorites);
    renderCard();

    await user.click(screen.getByRole('button', { name: 'Save to favorites' }));

    expect(favorites.toggle).toHaveBeenCalledWith('l1', expect.objectContaining({ _id: 'l1' }));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows an inline error when saving fails', async () => {
    const user = userEvent.setup();
    useAuth.mockReturnValue({ user: { id: 'u1' } });
    useFavorites.mockReturnValue(favoritesMock({ toggle: vi.fn(() => Promise.resolve(false)) }));
    renderCard();

    await user.click(screen.getByRole('button', { name: 'Save to favorites' }));

    expect((await screen.findByRole('alert')).textContent).toMatch(/couldn.t update saved items/i);
  });
});
