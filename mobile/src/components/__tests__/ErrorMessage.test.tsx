import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ErrorMessage } from '../ErrorMessage';

describe('ErrorMessage', () => {
  it('renders the default message when none provided', () => {
    render(<ErrorMessage />);
    expect(screen.getByText('Ocurrió un error. Intenta de nuevo.')).toBeTruthy();
  });

  it('renders a custom message', () => {
    render(<ErrorMessage message="No se pudo cargar el dashboard." />);
    expect(screen.getByText('No se pudo cargar el dashboard.')).toBeTruthy();
  });

  it('shows Reintentar button when onRetry is provided', () => {
    render(<ErrorMessage onRetry={jest.fn()} />);
    expect(screen.getByText('Reintentar')).toBeTruthy();
  });

  it('does not show Reintentar button when onRetry is not provided', () => {
    render(<ErrorMessage />);
    expect(screen.queryByText('Reintentar')).toBeNull();
  });

  it('calls onRetry when Reintentar is pressed', () => {
    const onRetry = jest.fn();
    render(<ErrorMessage onRetry={onRetry} />);
    fireEvent.press(screen.getByText('Reintentar'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
