// Global test setup file
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock global Date for deterministic tests
export const mockDate = (date: string | Date) => {
  const mockedDate = new Date(date);
  vi.useFakeTimers();
  vi.setSystemTime(mockedDate);
};

export const restoreDate = () => {
  vi.useRealTimers();
};

// Reset all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Restore real timers after all tests
afterAll(() => {
  vi.useRealTimers();
});
