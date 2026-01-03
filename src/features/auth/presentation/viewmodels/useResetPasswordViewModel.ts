// Reset Password ViewModel - Hook that manages reset password form state
// Implements MVVM pattern - acts as the ViewModel

import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';
import { AuthResult, createAuthError } from '../../domain/entities';
import { createUpdatePasswordUseCase } from '../../di/authContainer';

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

export interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

export interface ResetPasswordViewModel {
  // State
  formData: ResetPasswordFormData;
  isSubmitting: boolean;
  isSuccess: boolean;
  validationError: string | null;

  // Actions
  setPassword: (password: string) => void;
  setConfirmPassword: (confirmPassword: string) => void;
  validate: () => boolean;
  submit: () => Promise<AuthResult>;
}

export function useResetPasswordViewModel(): ResetPasswordViewModel {
  const [formData, setFormData] = useState<ResetPasswordFormData>({
    password: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const updatePasswordUseCase = useMemo(() => createUpdatePasswordUseCase(), []);

  const setPassword = useCallback((password: string) => {
    setFormData(prev => ({ ...prev, password }));
    setValidationError(null);
  }, []);

  const setConfirmPassword = useCallback((confirmPassword: string) => {
    setFormData(prev => ({ ...prev, confirmPassword }));
    setValidationError(null);
  }, []);

  const validate = useCallback((): boolean => {
    const result = resetPasswordSchema.safeParse(formData);
    if (!result.success) {
      setValidationError(result.error.errors[0].message);
      return false;
    }
    setValidationError(null);
    return true;
  }, [formData]);

  const submit = useCallback(async (): Promise<AuthResult> => {
    if (!validate()) {
      return { success: false, error: createAuthError('WEAK_PASSWORD', validationError || undefined) };
    }

    setIsSubmitting(true);
    try {
      const result = await updatePasswordUseCase.execute({ newPassword: formData.password });
      if (result.success) {
        setIsSuccess(true);
      }
      return result;
    } finally {
      setIsSubmitting(false);
    }
  }, [updatePasswordUseCase, formData, validate, validationError]);

  return {
    formData,
    isSubmitting,
    isSuccess,
    validationError,
    setPassword,
    setConfirmPassword,
    validate,
    submit,
  };
}
