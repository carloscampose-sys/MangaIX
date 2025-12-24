import { getGreeting } from './greetingUtils';

describe('getGreeting', () => {
  test('should return "Bienvenido" for masculino gender', () => {
    expect(getGreeting('masculino')).toBe('Bienvenido');
  });

  test('should return "Bienvenida" for femenino gender', () => {
    expect(getGreeting('femenino')).toBe('Bienvenida');
  });

  test('should return "Bienvenide" for otro gender', () => {
    expect(getGreeting('otro')).toBe('Bienvenide');
  });

  test('should return "Bienvenida" as default for unknown gender', () => {
    expect(getGreeting('unknown')).toBe('Bienvenida');
  });

  test('should return "Bienvenida" for null gender', () => {
    expect(getGreeting(null)).toBe('Bienvenida');
  });

  test('should return "Bienvenida" for undefined gender', () => {
    expect(getGreeting(undefined)).toBe('Bienvenida');
  });

  test('should handle case-sensitive gender values', () => {
    expect(getGreeting('Masculino')).toBe('Bienvenida'); // Should not match
    expect(getGreeting('FEMENINO')).toBe('Bienvenida'); // Should not match
  });
});
