// Tests for src/lib/utils.ts
import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn (className utility)', () => {
  describe('basic functionality', () => {
    it('should merge simple class names', () => {
      const result = cn('class1', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should return empty string when no arguments', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle single class name', () => {
      const result = cn('single-class');
      expect(result).toBe('single-class');
    });
  });

  describe('conditional classes', () => {
    it('should handle conditional object syntax', () => {
      const result = cn({ active: true, disabled: false });
      expect(result).toBe('active');
    });

    it('should handle mixed string and object syntax', () => {
      const result = cn('base-class', { active: true, hidden: false });
      expect(result).toBe('base-class active');
    });

    it('should handle undefined and null values', () => {
      const result = cn('class1', undefined, null, 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should handle false boolean', () => {
      const isActive = false;
      const result = cn('base', isActive && 'active');
      expect(result).toBe('base');
    });
  });

  describe('tailwind merge', () => {
    it('should merge conflicting tailwind classes', () => {
      const result = cn('p-4', 'p-8');
      expect(result).toBe('p-8');
    });

    it('should merge conflicting color classes', () => {
      const result = cn('text-red-500', 'text-blue-500');
      expect(result).toBe('text-blue-500');
    });

    it('should keep non-conflicting classes', () => {
      const result = cn('p-4', 'm-4', 'text-center');
      expect(result).toBe('p-4 m-4 text-center');
    });

    it('should handle responsive prefixes correctly', () => {
      const result = cn('p-4', 'md:p-8');
      expect(result).toBe('p-4 md:p-8');
    });
  });

  describe('array inputs', () => {
    it('should handle array of class names', () => {
      const result = cn(['class1', 'class2']);
      expect(result).toBe('class1 class2');
    });

    it('should handle nested arrays', () => {
      const result = cn(['class1', ['class2', 'class3']]);
      expect(result).toBe('class1 class2 class3');
    });
  });
});
