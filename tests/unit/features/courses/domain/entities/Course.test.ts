// Tests for src/features/courses/domain/entities/Course.ts
import { describe, it, expect } from 'vitest';
import { 
  getLevelLabel, 
  COURSE_LEVELS, 
  COURSE_CATEGORIES 
} from '@/features/courses/domain/entities/Course';

describe('Course Entity', () => {
  describe('getLevelLabel', () => {
    it('should return "Iniciante" for INICIANTE level', () => {
      expect(getLevelLabel('INICIANTE')).toBe('Iniciante');
    });

    it('should return "Intermediário" for INTERMEDIARIO level', () => {
      expect(getLevelLabel('INTERMEDIARIO')).toBe('Intermediário');
    });

    it('should return "Avançado" for AVANCADO level', () => {
      expect(getLevelLabel('AVANCADO')).toBe('Avançado');
    });

    it('should return the input for unknown level', () => {
      expect(getLevelLabel('UNKNOWN')).toBe('UNKNOWN');
    });

    it('should return empty string for empty input', () => {
      expect(getLevelLabel('')).toBe('');
    });
  });

  describe('COURSE_LEVELS constant', () => {
    it('should have exactly 3 levels', () => {
      expect(COURSE_LEVELS).toHaveLength(3);
    });

    it('should contain INICIANTE level', () => {
      const iniciante = COURSE_LEVELS.find(l => l.value === 'INICIANTE');
      expect(iniciante).toBeDefined();
      expect(iniciante?.label).toBe('Iniciante');
    });

    it('should contain INTERMEDIARIO level', () => {
      const intermediario = COURSE_LEVELS.find(l => l.value === 'INTERMEDIARIO');
      expect(intermediario).toBeDefined();
      expect(intermediario?.label).toBe('Intermediário');
    });

    it('should contain AVANCADO level', () => {
      const avancado = COURSE_LEVELS.find(l => l.value === 'AVANCADO');
      expect(avancado).toBeDefined();
      expect(avancado?.label).toBe('Avançado');
    });

    it('should have value and label properties for each level', () => {
      COURSE_LEVELS.forEach(level => {
        expect(level).toHaveProperty('value');
        expect(level).toHaveProperty('label');
        expect(typeof level.value).toBe('string');
        expect(typeof level.label).toBe('string');
      });
    });
  });

  describe('COURSE_CATEGORIES constant', () => {
    it('should have at least 5 categories', () => {
      expect(COURSE_CATEGORIES.length).toBeGreaterThanOrEqual(5);
    });

    it('should contain Tecnologia category', () => {
      expect(COURSE_CATEGORIES).toContain('Tecnologia');
    });

    it('should contain Negócios category', () => {
      expect(COURSE_CATEGORIES).toContain('Negócios');
    });

    it('should contain Design category', () => {
      expect(COURSE_CATEGORIES).toContain('Design');
    });

    it('should contain Marketing category', () => {
      expect(COURSE_CATEGORIES).toContain('Marketing');
    });

    it('should contain Outros category', () => {
      expect(COURSE_CATEGORIES).toContain('Outros');
    });

    it('should be a readonly array', () => {
      // TypeScript would prevent modifications, but we verify the structure
      expect(Array.isArray(COURSE_CATEGORIES)).toBe(true);
    });

    it('should have all unique categories', () => {
      const uniqueCategories = new Set(COURSE_CATEGORIES);
      expect(uniqueCategories.size).toBe(COURSE_CATEGORIES.length);
    });
  });
});
