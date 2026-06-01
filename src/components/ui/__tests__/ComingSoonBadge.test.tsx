/* eslint-env jest */
import { render, screen } from '@testing-library/react-native';
import { ComingSoonBadge } from '../ComingSoonBadge';

describe('ComingSoonBadge', () => {
  it('defaults to the "Bientôt" label', () => {
    render(<ComingSoonBadge />);
    expect(screen.getByText('Bientôt')).toBeTruthy();
  });

  it('renders a custom label when provided', () => {
    render(<ComingSoonBadge label="Bientôt disponible" />);
    expect(screen.getByText('Bientôt disponible')).toBeTruthy();
  });
});
