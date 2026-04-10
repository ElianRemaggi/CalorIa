import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { MealItem } from '../MealItem';
import { MealEntry } from '@/types';

const baseMeal: MealEntry = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  sourceType: 'manual',
  title: 'Pollo con arroz',
  mealDatetime: '2026-04-09T12:30:00Z',
  finalCalories: 450,
  finalProteinG: 35,
  finalCarbsG: 50,
  finalFatG: 10,
  createdAt: '2026-04-09T12:30:00Z',
};

describe('MealItem', () => {
  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the meal title', () => {
    render(<MealItem meal={baseMeal} onDelete={jest.fn()} />);
    expect(screen.getByText('Pollo con arroz')).toBeTruthy();
  });

  it('shows "Manual" badge for manual meals', () => {
    render(<MealItem meal={baseMeal} onDelete={jest.fn()} />);
    expect(screen.getByText('Manual')).toBeTruthy();
  });

  it('shows "IA" badge for photo meals', () => {
    const photoMeal: MealEntry = { ...baseMeal, sourceType: 'photo' };
    render(<MealItem meal={photoMeal} onDelete={jest.fn()} />);
    expect(screen.getByText('IA')).toBeTruthy();
  });

  it('renders calorie and macro values', () => {
    render(<MealItem meal={baseMeal} onDelete={jest.fn()} />);
    expect(screen.getByText('450kcal')).toBeTruthy();
    expect(screen.getByText('35g')).toBeTruthy();
    expect(screen.getByText('50g')).toBeTruthy();
    expect(screen.getByText('10g')).toBeTruthy();
  });

  it('shows Editar button only when onEdit is provided', () => {
    const { rerender } = render(<MealItem meal={baseMeal} onDelete={jest.fn()} />);
    expect(screen.queryByText('Editar')).toBeNull();

    rerender(<MealItem meal={baseMeal} onDelete={jest.fn()} onEdit={jest.fn()} />);
    expect(screen.getByText('Editar')).toBeTruthy();
  });

  it('calls onEdit when Editar is pressed', () => {
    const onEdit = jest.fn();
    render(<MealItem meal={baseMeal} onDelete={jest.fn()} onEdit={onEdit} />);
    fireEvent.press(screen.getByText('Editar'));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('shows Alert confirmation when Eliminar is pressed', () => {
    render(<MealItem meal={baseMeal} onDelete={jest.fn()} />);
    fireEvent.press(screen.getByText('Eliminar'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Eliminar comida',
      '¿Eliminar "Pollo con arroz"?',
      expect.any(Array)
    );
  });

  it('calls onDelete when alert destructive action is confirmed', () => {
    const onDelete = jest.fn();
    let destructiveCallback: (() => void) | undefined;

    jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      destructiveCallback = (buttons as { style: string; onPress?: () => void }[])
        .find((b) => b.style === 'destructive')?.onPress;
    });

    render(<MealItem meal={baseMeal} onDelete={onDelete} />);
    fireEvent.press(screen.getByText('Eliminar'));

    expect(destructiveCallback).toBeDefined();
    destructiveCallback!();
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('does not call onDelete when alert is cancelled', () => {
    const onDelete = jest.fn();
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

    render(<MealItem meal={baseMeal} onDelete={onDelete} />);
    fireEvent.press(screen.getByText('Eliminar'));
    expect(onDelete).not.toHaveBeenCalled();
  });
});
