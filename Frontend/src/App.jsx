import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import DocumentsPage from './pages/DocumentsPage';
import DocumentDetailPage from './pages/DocumentDetailPage';
import ChatPage from './pages/ChatPage';
import FlashcardsPage from './pages/FlashcardsPage';
import QuizPage from './pages/QuizPage';
import AnalyticsPage from './pages/AnalyticsPage';
import StudyPlanPage from './pages/StudyPlanPage';
import AIToolsPage from './pages/AIToolsPage';
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboardPage from './pages/AdminDashboardPage';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Toaster position="top-right" toastOptions={{
            style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 12, fontSize: 14 },
          }} />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/documents/:id" element={<DocumentDetailPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/flashcards" element={<FlashcardsPage />} />
              <Route path="/flashcards/:id" element={<FlashcardsPage />} />
              <Route path="/quiz" element={<QuizPage />} />
              <Route path="/quiz/:id" element={<QuizPage />} />
              {/* Premium pages */}
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/study-plan" element={<StudyPlanPage />} />
              <Route path="/ai-tools" element={<AIToolsPage />} />
            </Route>
            {/* Admin layout and routes */}
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<AdminDashboardPage />} />
              <Route path="/admin/documents" element={<AdminDashboardPage />} />
              <Route path="/admin/api-settings" element={<AdminDashboardPage />} />
              <Route path="/admin/billing" element={<AdminDashboardPage />} />
              <Route path="/admin/logs" element={<AdminDashboardPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
