// Re-export from new Clean Architecture location
// This file is kept for backward compatibility

export type { AppRole } from '@/features/auth/domain/entities/User';
export type { AuthUser, UserProfile } from '@/features/auth/presentation/context/AuthContext';

// Legacy type alias
export type UserStatus = 'ATIVO' | 'BLOQUEADO';
