// Auth ViewModel - Hook that manages authentication state
// Implements MVVM pattern - acts as the ViewModel

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AuthenticatedUser,
  AuthSession,
  AppRole,
  AuthResult,
} from '../../domain/entities';
import {
  getAuthRepository,
  createSignInUseCase,
  createSignUpUseCase,
  createSignOutUseCase,
  createResetPasswordUseCase,
  createUpdatePasswordUseCase,
} from '../../di/authContainer';

export interface AuthViewModel {
  // State
  user: AuthenticatedUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, fullName: string, role: Exclude<AppRole, 'ADMIN'>) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (newPassword: string) => Promise<AuthResult>;
  refreshUser: () => Promise<void>;
}

export function useAuthViewModel(): AuthViewModel {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get repository and create use cases
  const authRepository = useMemo(() => getAuthRepository(), []);
  const signInUseCase = useMemo(() => createSignInUseCase(), []);
  const signUpUseCase = useMemo(() => createSignUpUseCase(), []);
  const signOutUseCase = useMemo(() => createSignOutUseCase(), []);
  const resetPasswordUseCase = useMemo(() => createResetPasswordUseCase(), []);
  const updatePasswordUseCase = useMemo(() => createUpdatePasswordUseCase(), []);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = authRepository.onAuthStateChange((authUser, authSession) => {
      setUser(authUser);
      setSession(authSession);
      setIsLoading(false);
    });

    // Get initial session
    authRepository.getSession().then(({ user: authUser, session: authSession }) => {
      setUser(authUser);
      setSession(authSession);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [authRepository]);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    return signInUseCase.execute({ email, password });
  }, [signInUseCase]);

  const signUp = useCallback(async (
    email: string,
    password: string,
    fullName: string,
    role: Exclude<AppRole, 'ADMIN'>
  ): Promise<AuthResult> => {
    return signUpUseCase.execute({ email, password, fullName, role });
  }, [signUpUseCase]);

  const signOut = useCallback(async (): Promise<void> => {
    await signOutUseCase.execute();
    setUser(null);
    setSession(null);
  }, [signOutUseCase]);

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    return resetPasswordUseCase.execute({ email });
  }, [resetPasswordUseCase]);

  const updatePassword = useCallback(async (newPassword: string): Promise<AuthResult> => {
    return updatePasswordUseCase.execute({ newPassword });
  }, [updatePasswordUseCase]);

  const refreshUser = useCallback(async (): Promise<void> => {
    const { user: authUser, session: authSession } = await authRepository.getSession();
    setUser(authUser);
    setSession(authSession);
  }, [authRepository]);

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshUser,
  };
}
