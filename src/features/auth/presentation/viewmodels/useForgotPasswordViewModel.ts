// Forgot Password ViewModel - Hook that manages forgot password form state
// Implements MVVM pattern - acts as the ViewModel

import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';
import { AuthResult, createAuthError } from '../../domain/entities';
import { createResetPasswordUseCase } from '../../di/authContainer';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export interface ForgotPasswordViewModel {
  // State
  email: string;
  isSubmitting: boolean;
  isEmailSent: boolean;
  validationError: string | null;

  // Actions
  setEmail: (email: string) => void;
  validate: () => boolean;
  submit: () => Promise<AuthResult>;
}

export function useForgotPasswordViewModel(): ForgotPasswordViewModel {
  const [email, setEmailState] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const resetPasswordUseCase = useMemo(() => createResetPasswordUseCase(), []);

  const setEmail = useCallback((value: string) => {
    setEmailState(value);
    setValidationError(null);
  }, []);

  const validate = useCallback((): boolean => {
    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setValidationError(result.error.errors[0].message);
      return false;
    }
    setValidationError(null);
    return true;
  }, [email]);

  const submit = useCallback(async (): Promise<AuthResult> => {
    if (!validate()) {
      return { success: false, error: createAuthError('INVALID_EMAIL', validationError || undefined) };
    }

    setIsSubmitting(true);
    try {
      const result = await resetPasswordUseCase.execute({ email });
      if (result.success) {
        setIsEmailSent(true);
      }
      return result;
    } finally {
      setIsSubmitting(false);
    }
  }, [resetPasswordUseCase, email, validate, validationError]);

  return {
    email,
    isSubmitting,
    isEmailSent,
    validationError,
    setEmail,
    validate,
    submit,
  };
}
