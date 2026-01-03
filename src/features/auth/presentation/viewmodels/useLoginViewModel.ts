// Login ViewModel - Hook that manages login form state
// Implements MVVM pattern - acts as the ViewModel

import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';
import { AuthResult, createAuthError } from '../../domain/entities';
import { createSignInUseCase } from '../../di/authContainer';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export interface LoginFormData {
  email: string;
  password: string;
}

export interface LoginViewModel {
  // State
  formData: LoginFormData;
  isSubmitting: boolean;
  validationError: string | null;

  // Actions
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  validate: () => boolean;
  submit: () => Promise<AuthResult>;
}

export function useLoginViewModel(): LoginViewModel {
  const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const signInUseCase = useMemo(() => createSignInUseCase(), []);

  const setEmail = useCallback((email: string) => {
    setFormData(prev => ({ ...prev, email }));
    setValidationError(null);
  }, []);

  const setPassword = useCallback((password: string) => {
    setFormData(prev => ({ ...prev, password }));
    setValidationError(null);
  }, []);

  const validate = useCallback((): boolean => {
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      setValidationError(result.error.errors[0].message);
      return false;
    }
    setValidationError(null);
    return true;
  }, [formData]);

  const submit = useCallback(async (): Promise<AuthResult> => {
    if (!validate()) {
      return { success: false, error: createAuthError('INVALID_EMAIL', validationError || undefined) };
    }

    setIsSubmitting(true);
    try {
      return await signInUseCase.execute({
        email: formData.email,
        password: formData.password,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [signInUseCase, formData, validate, validationError]);

  return {
    formData,
    isSubmitting,
    validationError,
    setEmail,
    setPassword,
    validate,
    submit,
  };
}
