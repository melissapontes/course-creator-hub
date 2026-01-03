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
import CurriculumPage from "./pages/teacher/CurriculumPage";
import CourseCommentsPage from "./pages/teacher/CourseCommentsPage";

// Student Pages
import StudentDashboardPage from "./pages/student/StudentDashboardPage";

// Course Pages
import CourseCatalogPage from "./pages/courses/CourseCatalogPage";
import CourseDetailPage from "./pages/courses/CourseDetailPage";
import LearnCoursePage from "./pages/courses/LearnCoursePage";
import CheckoutPage from "./pages/CheckoutPage";

// Admin Pages
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminProfessorsPage from "./pages/admin/AdminProfessorsPage";
import AdminStudentsPage from "./pages/admin/AdminStudentsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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
              <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
              
              {/* Auth routes */}
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
              <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Profile (any authenticated user) */}
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

              {/* Teacher routes */}
              <Route path="/teacher" element={<ProtectedRoute allowedRoles={['PROFESSOR']}><TeacherDashboardPage /></ProtectedRoute>} />
              <Route path="/teacher/courses" element={<ProtectedRoute allowedRoles={['PROFESSOR']}><TeacherCoursesPage /></ProtectedRoute>} />
              <Route path="/teacher/courses/new" element={<ProtectedRoute allowedRoles={['PROFESSOR']}><NewCoursePage /></ProtectedRoute>} />
              <Route path="/teacher/courses/:id/curriculum" element={<ProtectedRoute allowedRoles={['PROFESSOR']}><CurriculumPage /></ProtectedRoute>} />
              <Route path="/teacher/courses/:id/comments" element={<ProtectedRoute allowedRoles={['PROFESSOR']}><CourseCommentsPage /></ProtectedRoute>} />

              {/* Student routes */}
              <Route path="/student" element={<ProtectedRoute allowedRoles={['ESTUDANTE']}><StudentDashboardPage /></ProtectedRoute>} />
              <Route path="/learn/:id" element={<ProtectedRoute allowedRoles={['ESTUDANTE', 'PROFESSOR']}><LearnCoursePage /></ProtectedRoute>} />

              {/* Admin routes */}
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboardPage /></ProtectedRoute>} />
              <Route path="/admin/professors" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminProfessorsPage /></ProtectedRoute>} />
              <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminStudentsPage /></ProtectedRoute>} />

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
