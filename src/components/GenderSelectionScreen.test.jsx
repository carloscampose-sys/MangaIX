import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GenderSelectionScreen from './GenderSelectionScreen';

describe('GenderSelectionScreen', () => {
  const mockOnGenderSelect = jest.fn();

  beforeEach(() => {
    mockOnGenderSelect.mockClear();
    localStorage.clear();
  });

  describe('Rendering', () => {
    test('should render the component with title', () => {
      render(
        <GenderSelectionScreen 
          userName="Test User" 
          onGenderSelect={mockOnGenderSelect} 
        />
      );
      
      expect(screen.getByText('¿Cuál es tu género, Potaxina?')).toBeInTheDocument();
    });

    test('should render all three gender options', () => {
      render(
        <GenderSelectionScreen 
          userName="Test User" 
          onGenderSelect={mockOnGenderSelect} 
        />
      );
      
      expect(screen.getByText('Masculino')).toBeInTheDocument();
      expect(screen.getByText('Femenino')).toBeInTheDocument();
      expect(screen.getByText('Otro')).toBeInTheDocument();
    });

    test('should render confirm button initially disabled', () => {
      render(
        <GenderSelectionScreen 
          userName="Test User" 
          onGenderSelect={mockOnGenderSelect} 
        />
      );
      
      const confirmButton = screen.getByText('Confirmar Género 🥑✨');
      expect(confirmButton).toBeDisabled();
    });

    test('should render all gender emojis', () => {
      render(
        <GenderSelectionScreen 
          userName="Test User" 
          onGenderSelect={mockOnGenderSelect} 
        />
      );
      
      expect(screen.getByText('👨')).toBeInTheDocument();
      expect(screen.getByText('👩')).toBeInTheDocument();
      expect(screen.getByText('🌈')).toBeInTheDocument();
    });
  });

  describe('Gender Selection', () => {
    test('should enable confirm button when a gender is selected', () => {
      render(
        <GenderSelectionScreen 
          userName="Test User" 
          onGenderSelect={mockOnGenderSelect} 
        />
      );
      
      const masculinoButton = screen.getByText('Masculino').closest('button');
      fireEvent.click(masculinoButton);
      
      const confirmButton = screen.getByText('Confirmar Género 🥑✨');
      expect(confirmButton).not.toBeDisabled();
    });

    test('should change visual indicator when gender is selected', () => {
      render(
        <GenderSelectionScreen 
          userName="Test User" 
          onGenderSelect={mockOnGenderSelect} 
        />
      );
      
      const masculinoButton = screen.getByText('Masculino').closest('button');
      fireEvent.click(masculinoButton);
      
      // Check if the button has the selected class (bg-blue-500)
      expect(masculinoButton).toHaveClass('bg-blue-500');
    });

    test('should allow changing gender selection', () => {
      render(
        <GenderSelectionScreen 
          userName="Test User" 
          onGenderSelect={mockOnGenderSelect} 
        />
      );
      
      const masculinoButton = screen.getByText('Masculino').closest('button');
      const femeninoButton = screen.getByText('Femenino').closest('button');
      
      fireEvent.click(masculinoButton);
      expect(masculinoButton).toHaveClass('bg-blue-500');
      
      fireEvent.click(femeninoButton);
      expect(femeninoButton).toHaveClass('bg-pink-500');
      expect(masculinoButton).not.toHaveClass('bg-blue-500');
    });
  });

  describe('Validation', () => {
    test('should show error when confirming without selection', () => {
      render(
        <GenderSelectionScreen 
          userName="Test User" 
          onGenderSelect={mockOnGenderSelect} 
        />
      );
      
      const confirmButton = screen.getByText('Confirmar Género 🥑✨');
      fireEvent.click(confirmButton);
      
      expect(screen.getByText('¡Espera, reina! Necesitamos saber tu género para la bendición potaxie 💅')).toBeInTheDocument();
    });

    test('should clear error when selecting a gender after error', () => {
      render(
        <GenderSelectionScreen 
          userName="Test User" 
          onGenderSelect={mockOnGenderSelect} 
        />
      );
      
      const confirmButton = screen.getByText('Confirmar Género 🥑✨');
      fireEvent.click(confirmButton);
      
      expect(screen.getByText('¡Espera, reina! Necesitamos saber tu género para la bendición potaxie 💅')).toBeInTheDocument();
      
      const masculinoButton = screen.getByText('Masculino').closest('button');
      fireEvent.click(masculinoButton);
      
      expect(screen.queryByText('¡Espera, reina! Necesitamos saber tu género para la bendición potaxie 💅')).not.toBeInTheDocument();
    });

    test('should not call onGenderSelect when confirming without selection', () => {
      render(
        <GenderSelectionScreen 
          userName="Test User" 
          onGenderSelect={mockOnGenderSelect} 
        />
      );
      
      const confirmButton = screen.getByText('Confirmar Género 🥑✨');
      fireEvent.click(confirmButton);
      
      expect(mockOnGenderSelect).not.toHaveBeenCalled();
    });
  });

  describe('Confirmation', () => {
    test('should call onGenderSelect with correct gender when confirming', () => {
      render(
        <GenderSelectionScreen 
          userName="Test User" 
          onGenderSelect={mockOnGenderSelect} 
        />
      );
      
      const masculinoButton = screen.getByText('Masculino').closest('button');
      fireEvent.click(masculinoButton);
      
      const confirmButton = screen.getByText('Confirmar Género 🥑✨');
      fireEvent.click(confirmButton);
      
      expect(mockOnGenderSelect).toHaveBeenCalledWith('masculino');
    });

    test('should save gender to localStorage when confirming', () => {
      render(
        <GenderSelectionScreen 
          userName="Test User" 
          onGenderSelect={mockOnGenderSelect} 
        />
      );
      
      const femeninoButton = screen.getByText('Femenino').closest('button');
      fireEvent.click(femeninoButton);
      
      const confirmButton = screen.getByText('Confirmar Género 🥑✨');
      fireEvent.click(confirmButton);
      
      expect(localStorage.getItem('userGender')).toBe('femenino');
    });

    test('should save all gender options to localStorage correctly', () => {
      const { rerender } = render(
        <GenderSelectionScreen 
          userName="Test User" 
          onGenderSelect={mockOnGenderSelect} 
        />
      );
      
      // Test Masculino
      let button = screen.getByText('Masculino').closest('button');
      fireEvent.click(button);
      fireEvent.click(screen.getByText('Confirmar Género 🥑✨'));
      expect(localStorage.getItem('userGender')).toBe('masculino');
      
      // Reset and test Femenino
      localStorage.clear();
      mockOnGenderSelect.mockClear();
      rerender(
        <GenderSelectionScreen 
          userName="Test User" 
          onGenderSelect={mockOnGenderSelect} 
        />
      );
      
      button = screen.getByText('Femenino').closest('button');
      fireEvent.click(button);
      fireEvent.click(screen.getByText('Confirmar Género 🥑✨'));
      expect(localStorage.getItem('userGender')).toBe('femenino');
      
      // Reset and test Otro
      localStorage.clear();
      mockOnGenderSelect.mockClear();
      rerender(
        <GenderSelectionScreen 
          userName="Test User" 
          onGenderSelect={mockOnGenderSelect} 
        />
      );
      
      button = screen.getByText('Otro').closest('button');
      fireEvent.click(button);
      fireEvent.click(screen.getByText('Confirmar Género 🥑✨'));
      expect(localStorage.getItem('userGender')).toBe('otro');
    });
  });
});
