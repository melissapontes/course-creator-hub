import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Save, Upload, User } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { authUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [profileData, setProfileData] = useState({
    full_name: '',
    display_name: '',
    bio: '',
    avatar_url: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (authUser) {
      setProfileData({
        full_name: authUser.profile?.full_name || '',
        display_name:
          authUser.role === 'PROFESSOR'
            ? authUser.professorProfile?.display_name || ''
            : authUser.studentProfile?.display_name || '',
        bio: authUser.professorProfile?.bio || '',
        avatar_url:
          authUser.role === 'PROFESSOR'
            ? authUser.professorProfile?.avatar_url || ''
            : authUser.studentProfile?.avatar_url || '',
      });
    }
  }, [authUser]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const updateProfile = useMutation({
    mutationFn: async () => {
      if (!authUser) throw new Error('Not authenticated');

      let avatar_url = profileData.avatar_url;

      // Upload avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${authUser.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
        avatar_url = urlData.publicUrl;
      }

      // Update main profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: profileData.full_name })
        .eq('user_id', authUser.id);

      if (profileError) throw profileError;

      // Update role-specific profile
      if (authUser.role === 'PROFESSOR') {
        const { error } = await supabase
          .from('professor_profiles')
          .update({
            display_name: profileData.display_name,
            bio: profileData.bio,
            avatar_url,
          })
          .eq('user_id', authUser.id);

        if (error) throw error;
      } else if (authUser.role === 'ESTUDANTE') {
        const { error } = await supabase
          .from('student_profiles')
          .update({
            display_name: profileData.display_name,
            avatar_url,
          })
          .eq('user_id', authUser.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      refreshUser();
      toast.success('Perfil atualizado com sucesso!');
      setAvatarFile(null);
      setAvatarPreview(null);
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData.full_name.trim()) {
      toast.error('O nome completo é obrigatório');
      return;
    }
    updateProfile.mutate();
  };

  const getInitials = () => {
    if (profileData.full_name) {
      return profileData.full_name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    }
    return 'U';
  };

  const displayAvatar = avatarPreview || profileData.avatar_url;

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
                  <AvatarImage src={displayAvatar} alt={profileData.full_name} />
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
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_name">Nome de Exibição</Label>
                <Input
                  id="display_name"
                  value={profileData.display_name}
                  onChange={(e) => setProfileData({ ...profileData, display_name: e.target.value })}
                  placeholder="Como você quer ser chamado"
                />
                <p className="text-xs text-muted-foreground">
                  Este nome será exibido publicamente
                </p>
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
                    {authUser?.role === 'PROFESSOR' ? 'Professor' : 'Estudante'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bio (only for professors) */}
          {authUser?.role === 'PROFESSOR' && (
            <Card>
              <CardHeader>
                <CardTitle>Biografia</CardTitle>
                <CardDescription>
                  Conte um pouco sobre você e sua experiência
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  placeholder="Escreva sobre sua experiência, formação e áreas de interesse..."
                  rows={4}
                />
              </CardContent>
            </Card>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? (
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
