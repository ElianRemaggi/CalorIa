import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { LoadingScreen } from '../LoadingScreen';

describe('LoadingScreen', () => {
  it('renders without crashing', () => {
    expect(() => render(<LoadingScreen />)).not.toThrow();
  });

  it('shows message when provided', () => {
    render(<LoadingScreen message="Cargando perfil..." />);
    expect(screen.getByText('Cargando perfil...')).toBeTruthy();
  });

  it('does not render message when not provided', () => {
    render(<LoadingScreen />);
    expect(screen.queryByText(/./)).toBeNull();
  });

  it('renders ActivityIndicator', () => {
    const { UNSAFE_getByType } = render(<LoadingScreen />);
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });
});
