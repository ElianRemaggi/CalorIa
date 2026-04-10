import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { MacroProgressBar } from '../MacroProgressBar';

describe('MacroProgressBar', () => {
  it('renders label and values with default unit', () => {
    render(<MacroProgressBar label="Proteínas" consumed={50} target={100} color="#4CAF50" />);
    expect(screen.getByText('Proteínas')).toBeTruthy();
    expect(screen.getByText('50g / 100g')).toBeTruthy();
  });

  it('uses custom unit', () => {
    render(
      <MacroProgressBar label="Calorías" consumed={1200} target={2000} color="#FF6B35" unit="kcal" />
    );
    expect(screen.getByText('1200kcal / 2000kcal')).toBeTruthy();
  });

  it('does not crash when target is 0', () => {
    expect(() =>
      render(<MacroProgressBar label="Test" consumed={0} target={0} color="#4CAF50" />)
    ).not.toThrow();
    expect(screen.getByText('0g / 0g')).toBeTruthy();
  });

  it('does not crash when consumed exceeds target', () => {
    expect(() =>
      render(<MacroProgressBar label="Test" consumed={150} target={100} color="#4CAF50" />)
    ).not.toThrow();
    expect(screen.getByText('150g / 100g')).toBeTruthy();
  });

  it('renders with zero consumed', () => {
    render(<MacroProgressBar label="Grasas" consumed={0} target={60} color="#FF9800" />);
    expect(screen.getByText('0g / 60g')).toBeTruthy();
  });
});
