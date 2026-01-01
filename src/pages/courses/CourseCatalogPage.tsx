import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookOpen, Search, Filter, GraduationCap, Calendar, X, ArrowUpDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

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

const DATE_FILTERS = [
  { value: 'all', label: 'Qualquer data' },
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: 'Última semana' },
  { value: 'month', label: 'Último mês' },
  { value: '3months', label: 'Últimos 3 meses' },
  { value: 'year', label: 'Último ano' },
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'oldest', label: 'Mais antigos' },
  { value: 'title_asc', label: 'Título (A-Z)' },
  { value: 'title_desc', label: 'Título (Z-A)' },
];

type CourseWithInstructor = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  thumbnail_url: string | null;
  category: string | null;
  level: string;
  language: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  instructor_id: string;
  instructor_name?: string;
};

export default function CourseCatalogPage() {
  const { authUser } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [level, setLevel] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [instructorNames, setInstructorNames] = useState<Record<string, string>>({});

  // Use DashboardLayout if user is logged in, otherwise PublicLayout
  const Layout = authUser ? DashboardLayout : PublicLayout;

  const { data: courses, isLoading } = useQuery({
    queryKey: ['public-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'PUBLICADO')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CourseWithInstructor[];
    },
  });

  // Fetch instructor names from profiles table
  useEffect(() => {
    if (!courses || courses.length === 0) return;

    const instructorIds = [...new Set(courses.map(c => c.instructor_id))];
    
    const fetchInstructors = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', instructorIds);

      if (data) {
        const names: Record<string, string> = {};
        data.forEach(p => {
          names[p.id] = p.full_name;
        });
        setInstructorNames(names);
      }
    };

    fetchInstructors();
  }, [courses]);

  const filteredAndSortedCourses = useMemo(() => {
    if (!courses) return [];

    let result = courses.filter((course) => {
      // Search filter
      const matchesSearch =
        !search ||
        course.title.toLowerCase().includes(search.toLowerCase()) ||
        course.subtitle?.toLowerCase().includes(search.toLowerCase()) ||
        course.description?.toLowerCase().includes(search.toLowerCase());

      // Category filter
      const matchesCategory = category === 'all' || course.category === category;

      // Level filter
      const matchesLevel = level === 'all' || course.level === level;

      // Date filter
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const courseDate = new Date(course.created_at);
        const now = new Date();
        
        switch (dateFilter) {
          case 'today':
            matchesDate = courseDate.toDateString() === now.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = courseDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = courseDate >= monthAgo;
            break;
          case '3months':
            const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            matchesDate = courseDate >= threeMonthsAgo;
            break;
          case 'year':
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            matchesDate = courseDate >= yearAgo;
            break;
        }
      }

      return matchesSearch && matchesCategory && matchesLevel && matchesDate;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'title_desc':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return result;
  }, [courses, search, category, level, dateFilter, sortBy]);

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      INICIANTE: 'Iniciante',
      INTERMEDIARIO: 'Intermediário',
      AVANCADO: 'Avançado',
    };
    return labels[level] || level;
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      INICIANTE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      INTERMEDIARIO: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      AVANCADO: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[level] || '';
  };

  const hasActiveFilters = category !== 'all' || level !== 'all' || dateFilter !== 'all' || search;

  const clearAllFilters = () => {
    setSearch('');
    setCategory('all');
    setLevel('all');
    setDateFilter('all');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold text-foreground mb-4">
            Explorar Cursos
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubra cursos incríveis ministrados por especialistas
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8 shadow-sm">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cursos por título, descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap gap-3">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2 shrink-0" />
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <GraduationCap className="h-4 w-4 mr-2 shrink-0" />
                  <SelectValue placeholder="Nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Níveis</SelectItem>
                  <SelectItem value="INICIANTE">Iniciante</SelectItem>
                  <SelectItem value="INTERMEDIARIO">Intermediário</SelectItem>
                  <SelectItem value="AVANCADO">Avançado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Calendar className="h-4 w-4 mr-2 shrink-0" />
                  <SelectValue placeholder="Data" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FILTERS.map((df) => (
                    <SelectItem key={df.value} value={df.value}>
                      {df.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <ArrowUpDown className="h-4 w-4 mr-2 shrink-0" />
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpar filtros
                </Button>
              )}
            </div>

            {/* Active filters badges */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 pt-2">
                {search && (
                  <Badge variant="secondary" className="gap-1">
                    Busca: "{search}"
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSearch('')} />
                  </Badge>
                )}
                {category !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {category}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setCategory('all')} />
                  </Badge>
                )}
                {level !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {getLevelLabel(level)}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setLevel('all')} />
                  </Badge>
                )}
                {dateFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {DATE_FILTERS.find(d => d.value === dateFilter)?.label}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setDateFilter('all')} />
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Results count */}
        {!isLoading && (
          <p className="text-sm text-muted-foreground mb-6">
            {filteredAndSortedCourses.length} curso(s) encontrado(s)
          </p>
        )}

        {/* Courses Grid */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-44 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAndSortedCourses.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAndSortedCourses.map((course) => (
              <Link key={course.id} to={`/courses/${course.id}`}>
                <Card className="overflow-hidden h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-border">
                  <div className="h-44 bg-muted flex items-center justify-center relative">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen className="w-12 h-12 text-muted-foreground" />
                    )}
                    <Badge className={`absolute top-3 right-3 ${getLevelColor(course.level)}`}>
                      {getLevelLabel(course.level)}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground line-clamp-1 mb-1">
                      {course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                      {course.subtitle || course.description || 'Sem descrição'}
                    </p>
                    
                    {instructorNames[course.instructor_id] && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Por: <span className="text-foreground">{instructorNames[course.instructor_id]}</span>
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                      <div className="flex flex-col gap-1">
                        {course.category && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                            {course.category}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(course.created_at)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-border">
            <CardContent className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Nenhum curso encontrado
              </h3>
              <p className="text-muted-foreground mb-4">
                Tente ajustar os filtros ou buscar por outros termos
              </p>
              <Button variant="outline" onClick={clearAllFilters}>
                Limpar Filtros
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
