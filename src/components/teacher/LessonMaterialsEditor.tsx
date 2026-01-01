import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Download, Link as LinkIcon, FileText, Trash2, Edit, Loader2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

interface Material {
  id: string;
  lesson_id: string;
  type: 'DOWNLOAD' | 'LINK' | 'TEXT';
  title: string;
  content: string | null;
  file_url: string | null;
  order_index: number;
}

interface Props {
  lessonId: string;
  courseId: string;
}

export function LessonMaterialsEditor({ lessonId, courseId }: Props) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMaterial, setEditMaterial] = useState<Material | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    type: 'LINK' as 'DOWNLOAD' | 'LINK' | 'TEXT',
    title: '',
    content: '',
  });
  const [file, setFile] = useState<File | null>(null);

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['lesson-materials', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_materials')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index');
      if (error) throw error;
      return data as Material[];
    },
    enabled: !!lessonId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      let file_url = editMaterial?.file_url || null;

      if (file && formData.type === 'DOWNLOAD') {
        const fileExt = file.name.split('.').pop();
        const fileName = `${courseId}/${lessonId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('lesson-materials')
          .upload(fileName, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('lesson-materials').getPublicUrl(fileName);
        file_url = urlData.publicUrl;
      }

      const payload = {
        lesson_id: lessonId,
        type: formData.type,
        title: formData.title,
        content: formData.type === 'DOWNLOAD' ? file?.name || editMaterial?.content : formData.content,
        file_url: formData.type === 'DOWNLOAD' ? file_url : null,
      };

      if (editMaterial) {
        const { error } = await supabase
          .from('lesson_materials')
          .update(payload)
          .eq('id', editMaterial.id);
        if (error) throw error;
      } else {
        const maxOrder = materials.length ? Math.max(...materials.map(m => m.order_index)) : -1;
        const { error } = await supabase
          .from('lesson_materials')
          .insert({ ...payload, order_index: maxOrder + 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-materials', lessonId] });
      toast.success(editMaterial ? 'Material atualizado!' : 'Material adicionado!');
      closeDialog();
    },
    onError: () => toast.error('Erro ao salvar material'),
    onSettled: () => setUploading(false),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('lesson_materials').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-materials', lessonId] });
      toast.success('Material excluído!');
      setDeleteId(null);
    },
    onError: () => toast.error('Erro ao excluir material'),
  });

  const openDialog = (material?: Material) => {
    if (material) {
      setEditMaterial(material);
      setFormData({
        type: material.type,
        title: material.title,
        content: material.content || '',
      });
    } else {
      setEditMaterial(null);
      setFormData({ type: 'LINK', title: '', content: '' });
    }
    setFile(null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditMaterial(null);
    setFormData({ type: 'LINK', title: '', content: '' });
    setFile(null);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'DOWNLOAD': return <Download className="h-4 w-4" />;
      case 'LINK': return <LinkIcon className="h-4 w-4" />;
      case 'TEXT': return <FileText className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Materiais da Aula</CardTitle>
          <Button size="sm" variant="outline" onClick={() => openDialog()}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="py-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : materials.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum material adicionado</p>
        ) : (
          <div className="space-y-2">
            {materials.map((material) => (
              <div
                key={material.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">
                  {getIcon(material.type)}
                </div>
                <span className="flex-1 truncate">{material.title}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDialog(material)}>
                  <Edit className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-destructive" 
                  onClick={() => setDeleteId(material.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMaterial ? 'Editar Material' : 'Novo Material'}</DialogTitle>
            <DialogDescription>Adicione recursos extras para a aula</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select 
                value={formData.type} 
                onValueChange={(v) => setFormData({ ...formData, type: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LINK">Link Externo</SelectItem>
                  <SelectItem value="DOWNLOAD">Arquivo para Download</SelectItem>
                  <SelectItem value="TEXT">Texto / Artigo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                placeholder="Ex: Slides da aula"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {formData.type === 'LINK' && (
              <div className="space-y-2">
                <Label>URL do Link</Label>
                <Input
                  placeholder="https://..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />
              </div>
            )}

            {formData.type === 'DOWNLOAD' && (
              <div className="space-y-2">
                <Label>Arquivo</Label>
                <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                {editMaterial?.file_url && !file && (
                  <p className="text-xs text-muted-foreground">Arquivo atual: {editMaterial.content}</p>
                )}
              </div>
            )}

            {formData.type === 'TEXT' && (
              <div className="space-y-2">
                <Label>Conteúdo</Label>
                <Textarea
                  placeholder="Digite o conteúdo do texto..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!formData.title.trim() || uploading || saveMutation.isPending}
            >
              {uploading || saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir material?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
