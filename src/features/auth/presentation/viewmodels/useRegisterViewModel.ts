// Register ViewModel - Hook that manages register form state
// Implements MVVM pattern - acts as the ViewModel

import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';
import { AuthResult, createAuthError, AppRole } from '../../domain/entities';
import { createSignUpUseCase } from '../../di/authContainer';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('Email inválido').max(255),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  role: z.enum(['PROFESSOR', 'ESTUDANTE']),
});

export type RegisterRole = Exclude<AppRole, 'ADMIN'>;

export interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  role: RegisterRole;
}

export interface RegisterViewModel {
  // State
  formData: RegisterFormData;
  isSubmitting: boolean;
  validationError: string | null;

  // Actions
  setFullName: (fullName: string) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setRole: (role: RegisterRole) => void;
  validate: () => boolean;
  submit: () => Promise<AuthResult>;
}

export function useRegisterViewModel(): RegisterViewModel {
  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: '',
    email: '',
    password: '',
    role: 'ESTUDANTE',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const signUpUseCase = useMemo(() => createSignUpUseCase(), []);

  const setFullName = useCallback((fullName: string) => {
    setFormData(prev => ({ ...prev, fullName }));
    setValidationError(null);
  }, []);

  const setEmail = useCallback((email: string) => {
    setFormData(prev => ({ ...prev, email }));
    setValidationError(null);
  }, []);

  const setPassword = useCallback((password: string) => {
    setFormData(prev => ({ ...prev, password }));
    setValidationError(null);
  }, []);

  const setRole = useCallback((role: RegisterRole) => {
    setFormData(prev => ({ ...prev, role }));
  }, []);

  const validate = useCallback((): boolean => {
    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      setValidationError(result.error.errors[0].message);
      return false;
    }
    setValidationError(null);
    return true;
  }, [formData]);

  const submit = useCallback(async (): Promise<AuthResult> => {
    if (!validate()) {
      return { success: false, error: createAuthError('UNKNOWN_ERROR', validationError || undefined) };
    }

    setIsSubmitting(true);
    try {
      return await signUpUseCase.execute({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role: formData.role,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [signUpUseCase, formData, validate, validationError]);

  return {
    formData,
    isSubmitting,
    validationError,
    setFullName,
    setEmail,
    setPassword,
    setRole,
    validate,
    submit,
  };
}
