import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PublicRoute } from "@/components/auth/PublicRoute";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import NotFound from "./pages/NotFound";
import ProfilePage from "./pages/ProfilePage";

// Teacher Pages
import TeacherDashboardPage from "./pages/teacher/TeacherDashboardPage";
import TeacherCoursesPage from "./pages/teacher/TeacherCoursesPage";
import NewCoursePage from "./pages/teacher/NewCoursePage";
import EditCoursePage from "./pages/teacher/EditCoursePage";
import CurriculumPage from "./pages/teacher/CurriculumPage";
import CourseCommentsPage from "./pages/teacher/CourseCommentsPage";

// Student Pages
import StudentDashboardPage from "./pages/student/StudentDashboardPage";

// Course Pages
import CourseCatalogPage from "./pages/courses/CourseCatalogPage";
import CourseDetailPage from "./pages/courses/CourseDetailPage";
import LearnCoursePage from "./pages/courses/LearnCoursePage";
import CheckoutPage from "./pages/CheckoutPage";

// Admin Placeholder
const AdminPlaceholder = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-3xl font-display font-bold text-foreground">Painel Administrativo</h1>
      <p className="text-muted-foreground mt-2">Em breve...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/courses" element={<CourseCatalogPage />} />
              <Route path="/courses/:id" element={<CourseDetailPage />} />
              <Route path="/checkout" element={<ProtectedRoute allowedRoles={['ESTUDANTE', 'PROFESSOR', 'ADMIN']}><CheckoutPage /></ProtectedRoute>} />
              
              {/* Auth routes */}
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Profile (any authenticated user) */}
              <Route path="/profile" element={<ProtectedRoute allowedRoles={['PROFESSOR', 'ESTUDANTE', 'ADMIN']}><ProfilePage /></ProtectedRoute>} />

              {/* Teacher routes */}
              <Route path="/teacher" element={<ProtectedRoute allowedRoles={['PROFESSOR']}><TeacherDashboardPage /></ProtectedRoute>} />
              <Route path="/teacher/courses" element={<ProtectedRoute allowedRoles={['PROFESSOR']}><TeacherCoursesPage /></ProtectedRoute>} />
              <Route path="/teacher/courses/new" element={<ProtectedRoute allowedRoles={['PROFESSOR']}><NewCoursePage /></ProtectedRoute>} />
              <Route path="/teacher/courses/:id/edit" element={<ProtectedRoute allowedRoles={['PROFESSOR']}><EditCoursePage /></ProtectedRoute>} />
              <Route path="/teacher/courses/:id/curriculum" element={<ProtectedRoute allowedRoles={['PROFESSOR']}><CurriculumPage /></ProtectedRoute>} />
              <Route path="/teacher/courses/:id/comments" element={<ProtectedRoute allowedRoles={['PROFESSOR']}><CourseCommentsPage /></ProtectedRoute>} />

              {/* Student routes */}
              <Route path="/student" element={<ProtectedRoute allowedRoles={['ESTUDANTE']}><StudentDashboardPage /></ProtectedRoute>} />
              <Route path="/student/courses" element={<ProtectedRoute allowedRoles={['ESTUDANTE']}><StudentDashboardPage /></ProtectedRoute>} />
              <Route path="/learn/:id" element={<ProtectedRoute allowedRoles={['ESTUDANTE']}><LearnCoursePage /></ProtectedRoute>} />
              <Route path="/student/courses" element={<ProtectedRoute allowedRoles={['ESTUDANTE']}><StudentDashboardPage /></ProtectedRoute>} />

              {/* Admin routes */}
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminPlaceholder /></ProtectedRoute>} />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
