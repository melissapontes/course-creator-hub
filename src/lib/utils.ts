/**
 * @fileoverview Utilitários gerais da aplicação
 * @module lib/utils
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes CSS utilizando clsx e tailwind-merge.
 * 
 * Esta função é o padrão para composição de classes no projeto.
 * Ela resolve conflitos de classes Tailwind automaticamente.
 * 
 * @param inputs - Classes CSS a serem combinadas (strings, objetos, arrays)
 * @returns String com as classes combinadas e conflitos resolvidos
 * 
 * @example
 * // Uso básico
 * cn('px-4', 'py-2', 'bg-primary')
 * // => 'px-4 py-2 bg-primary'
 * 
 * @example
 * // Com condicionais
 * cn('base-class', isActive && 'active-class', { 'disabled': isDisabled })
 * 
 * @example
 * // Resolvendo conflitos (tailwind-merge)
 * cn('px-4', 'px-8')
 * // => 'px-8' (última classe vence)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
