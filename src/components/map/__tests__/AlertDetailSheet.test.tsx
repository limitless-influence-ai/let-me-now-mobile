/* eslint-env jest */
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react-native';
import { AlertDetailSheet } from '../AlertDetailSheet';
import { Alert } from '@/types/alert.types';

// Render children inline (avoid Modal/MapView native concerns in unit tests).
jest.mock('@/components/shared/BottomSheet', () => ({
  BottomSheet: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('react-native-maps', () => {
  const RN = jest.requireActual('react-native');
  return { __esModule: true, default: RN.View, Marker: RN.View };
});

const baseAlert: Alert = {
  id: 'a1',
  userId: 'author-1',
  type: 'PICKPOCKET',
  lat: 48.8566,
  lon: 2.3522,
  locationLabel: 'Châtelet',
  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  expiresAt: null,
  comment: null,
  photoUrl: null,
  radiusM: 500,
};

const noop = () => {};

describe('AlertDetailSheet — self-vote guard', () => {
  it('shows vote buttons for a non-author authenticated user', () => {
    render(
      <AlertDetailSheet
        alert={baseAlert}
        isAuthenticated
        isOwnAlert={false}
        onClose={noop}
        onConfirm={noop}
        onInvalidate={noop}
      />,
    );
    expect(screen.getByText('Confirmer')).toBeTruthy();
    expect(screen.getByText('Invalider')).toBeTruthy();
  });

  it('hides vote buttons and explains why on the user own alert', () => {
    render(
      <AlertDetailSheet
        alert={baseAlert}
        isAuthenticated
        isOwnAlert
        onClose={noop}
        onConfirm={noop}
        onInvalidate={noop}
      />,
    );
    expect(screen.queryByText('Confirmer')).toBeNull();
    expect(screen.queryByText('Invalider')).toBeNull();
    expect(screen.getByText(/vous ne pouvez pas voter/i)).toBeTruthy();
  });

  it('shows the login invitation for a visitor', () => {
    render(
      <AlertDetailSheet
        alert={baseAlert}
        isAuthenticated={false}
        onClose={noop}
        onConfirm={noop}
        onInvalidate={noop}
      />,
    );
    expect(screen.queryByText('Confirmer')).toBeNull();
    expect(screen.getByText(/Connecte-toi/i)).toBeTruthy();
  });
});
