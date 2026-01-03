// Profile ViewModel - Hook that manages profile editing
// Implements MVVM pattern - acts as the ViewModel

import { useState, useCallback, useMemo } from 'react';
import { AuthResult } from '../../domain/entities';
import { createUpdateProfileUseCase } from '../../di/authContainer';

export interface ProfileFormData {
  fullName: string;
  avatarUrl: string;
}

export interface ProfileViewModel {
  // State
  formData: ProfileFormData;
  avatarFile: File | null;
  avatarPreview: string | null;
  isSubmitting: boolean;

  // Actions
  setFullName: (name: string) => void;
  setAvatarFile: (file: File | null) => void;
  resetForm: (initialData: ProfileFormData) => void;
  submitProfile: (userId: string) => Promise<AuthResult>;
}

export function useProfileViewModel(initialData?: ProfileFormData): ProfileViewModel {
  const [formData, setFormData] = useState<ProfileFormData>(
    initialData || { fullName: '', avatarUrl: '' }
  );
  const [avatarFile, setAvatarFileState] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateProfileUseCase = useMemo(() => createUpdateProfileUseCase(), []);

  const setFullName = useCallback((name: string) => {
    setFormData(prev => ({ ...prev, fullName: name }));
  }, []);

  const setAvatarFile = useCallback((file: File | null) => {
    setAvatarFileState(file);
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
    } else {
      setAvatarPreview(null);
    }
  }, []);

  const resetForm = useCallback((initialData: ProfileFormData) => {
    setFormData(initialData);
    setAvatarFileState(null);
    setAvatarPreview(null);
  }, []);

  const submitProfile = useCallback(async (userId: string): Promise<AuthResult> => {
    setIsSubmitting(true);

    try {
      const result = await updateProfileUseCase.execute(
        userId,
        { fullName: formData.fullName, avatarUrl: formData.avatarUrl },
        avatarFile || undefined
      );

      if (result.success) {
        setAvatarFileState(null);
        setAvatarPreview(null);
      }

      return result;
    } finally {
      setIsSubmitting(false);
    }
  }, [updateProfileUseCase, formData, avatarFile]);

  return {
    formData,
    avatarFile,
    avatarPreview,
    isSubmitting,
    setFullName,
    setAvatarFile,
    resetForm,
    submitProfile,
  };
}
