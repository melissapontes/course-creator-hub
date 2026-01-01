import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Loader2, Save, Eye, EyeOff, Layers, Upload, Image, X, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

const CATEGORIES = [
  'Tecnologia',
  'Negócios',
  'Design',
  'Marketing',
  'Desenvolvimento Pessoal',
  'Música',
  'Fotografia',
  'Saúde',
  'Idiomas',
  'Outros',
];

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  const { authUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    category: '',
    level: 'INICIANTE' as 'INICIANTE' | 'INTERMEDIARIO' | 'AVANCADO',
    language: 'pt-BR',
    thumbnail_url: '',
    price: 0,
  });
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        subtitle: course.subtitle || '',
        description: course.description || '',
        category: course.category || '',
        level: (course.level as 'INICIANTE' | 'INTERMEDIARIO' | 'AVANCADO') || 'INICIANTE',
        language: course.language || 'pt-BR',
        thumbnail_url: course.thumbnail_url || '',
        price: Number(course.price) || 0,
      });
    }
  }, [course]);

  const handleThumbnailUpload = async (file: File) => {
    if (!file || !id || !authUser) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setIsUploadingThumbnail(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}-${Date.now()}.${fileExt}`;
      const filePath = `${authUser.id}/${fileName}`;

      // Upload to thumbnails bucket
      const { error: uploadError } = await supabase.storage
        .from('thumbnails')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(filePath);

      // Update form data
      setFormData(prev => ({ ...prev, thumbnail_url: publicUrl }));
      toast.success('Imagem enviada com sucesso!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar imagem');
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  const removeThumbnail = () => {
    setFormData(prev => ({ ...prev, thumbnail_url: '' }));
  };

  const updateCourse = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('courses')
        .update(formData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
      toast.success('Curso atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar curso');
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async () => {
      const newStatus = course?.status === 'PUBLICADO' ? 'RASCUNHO' : 'PUBLICADO';
      const { error } = await supabase
        .from('courses')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
      toast.success(newStatus === 'PUBLICADO' ? 'Curso publicado!' : 'Curso despublicado');
    },
    onError: () => {
      toast.error('Erro ao atualizar status');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('O título é obrigatório');
      return;
    }
    updateCourse.mutate();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-4xl mx-auto">
          <Skeleton className="h-8 w-48 mb-8" />
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">Curso não encontrado</h1>
          <Button onClick={() => navigate('/teacher/courses')} className="mt-4">
            Voltar aos Cursos
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Verify ownership
  if (course.instructor_id !== authUser?.id) {
    navigate('/teacher/courses');
    return null;
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/teacher/courses')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar aos Cursos
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Editar Curso</h1>
              <p className="text-muted-foreground mt-1">{course.title}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to={`/teacher/courses/${id}/curriculum`}>
                <Button variant="outline">
                  <Layers className="mr-2 h-4 w-4" />
                  Gerenciar Conteúdo
                </Button>
              </Link>
              <Link to={`/teacher/courses/${id}/comments`}>
                <Button variant="outline">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Comentários
                </Button>
              </Link>
              <Button
                variant={course.status === 'PUBLICADO' ? 'outline' : 'default'}
                onClick={() => toggleStatus.mutate()}
                disabled={toggleStatus.isPending}
              >
                {course.status === 'PUBLICADO' ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Despublicar
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Publicar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="basic">
          <TabsList className="mb-6">
            <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="media">Mídia</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Curso</CardTitle>
                  <CardDescription>
                    Informações básicas exibidas na página do curso
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      placeholder="Ex: Introdução ao React"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subtitle">Subtítulo</Label>
                    <Input
                      id="subtitle"
                      placeholder="Uma breve descrição do curso"
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      placeholder="Descreva detalhadamente o conteúdo do curso..."
                      rows={5}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes do Curso</CardTitle>
                  <CardDescription>
                    Configurações adicionais do curso
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="level">Nível</Label>
                      <Select
                        value={formData.level}
                        onValueChange={(value) => setFormData({ ...formData, level: value as 'INICIANTE' | 'INTERMEDIARIO' | 'AVANCADO' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INICIANTE">Iniciante</SelectItem>
                          <SelectItem value="INTERMEDIARIO">Intermediário</SelectItem>
                          <SelectItem value="AVANCADO">Avançado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="language">Idioma</Label>
                      <Select
                        value={formData.language}
                        onValueChange={(value) => setFormData({ ...formData, language: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Preço (R$)</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Deixe 0 para curso gratuito
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="media">
              <Card>
                <CardHeader>
                  <CardTitle>Imagem do Curso</CardTitle>
                  <CardDescription>
                    Adicione uma imagem de capa para o curso (recomendado: 16:9, max 5MB)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {/* Thumbnail Preview */}
                    {formData.thumbnail_url ? (
                      <div className="relative w-full max-w-md">
                        <img
                          src={formData.thumbnail_url}
                          alt="Thumbnail do curso"
                          className="w-full h-48 object-cover rounded-lg border border-border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={removeThumbnail}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="w-full max-w-md h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors bg-muted/50"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Image className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Clique para fazer upload
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG ou WEBP (max 5MB)
                        </p>
                      </div>
                    )}

                    {/* Upload Button */}
                    <div className="flex gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleThumbnailUpload(file);
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingThumbnail}
                      >
                        {isUploadingThumbnail ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            {formData.thumbnail_url ? 'Alterar Imagem' : 'Enviar Imagem'}
                          </>
                        )}
                      </Button>
                    </div>

                    {/* URL Manual (optional) */}
                    <div className="pt-4 border-t border-border">
                      <Label htmlFor="thumbnail_url" className="text-sm text-muted-foreground">
                        Ou insira a URL da imagem manualmente:
                      </Label>
                      <Input
                        id="thumbnail_url"
                        type="url"
                        placeholder="https://..."
                        value={formData.thumbnail_url}
                        onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <div className="flex justify-end gap-4 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/teacher/courses')}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updateCourse.isPending}>
                {updateCourse.isPending ? (
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
