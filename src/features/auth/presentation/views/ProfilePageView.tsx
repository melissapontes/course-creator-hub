// Profile Page View
// Implements MVVM pattern - acts as the View

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfileViewModel } from '../viewmodels/useProfileViewModel';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Save, Upload, User } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePageView() {
  const { authUser, refreshUser } = useAuth();
  const navigate = useNavigate();

  const viewModel = useProfileViewModel({
    fullName: authUser?.profile?.full_name || '',
    avatarUrl: authUser?.profile?.avatar_url || '',
  });

  useEffect(() => {
    if (authUser) {
      viewModel.resetForm({
        fullName: authUser.profile?.full_name || '',
        avatarUrl: authUser.profile?.avatar_url || '',
      });
    }
  }, [authUser?.id]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB');
        return;
      }
      viewModel.setAvatarFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authUser) return;

    const result = await viewModel.submitProfile(authUser.id);

    if (result.success) {
      refreshUser();
      toast.success('Perfil atualizado com sucesso!');
    } else {
      toast.error(result.error?.message || 'Erro ao atualizar perfil');
    }
  };

  const getInitials = () => {
    if (viewModel.formData.fullName) {
      return viewModel.formData.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    }
    return 'U';
  };

  const displayAvatar = viewModel.avatarPreview || viewModel.formData.avatarUrl;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">Meu Perfil</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas informações pessoais</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar */}
          <Card>
            <CardHeader>
              <CardTitle>Foto de Perfil</CardTitle>
              <CardDescription>Sua foto será exibida em seu perfil público</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={displayAvatar || undefined} alt={viewModel.formData.fullName} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Label htmlFor="avatar" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Alterar Foto
                        </span>
                      </Button>
                    </div>
                  </Label>
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    JPG, PNG ou WebP. Máximo 5MB.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input
                  id="full_name"
                  value={viewModel.formData.fullName}
                  onChange={(e) => viewModel.setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={authUser?.email || ''} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">
                  O email não pode ser alterado
                </p>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Conta</Label>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="badge-primary">
                    {authUser?.role === 'PROFESSOR' ? 'Professor' : authUser?.role === 'ADMIN' ? 'Administrador' : 'Estudante'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={viewModel.isSubmitting}>
              {viewModel.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
