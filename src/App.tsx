import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/lib/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ToastContainer } from '@/components/Toast';
import { ProtectedRoute } from '@/components/ProtectedRoute';

import { HomePage } from '@/pages/HomePage';
import { BooksPage } from '@/pages/BooksPage';
import { BookDetailPage } from '@/pages/BookDetailPage';
import { AboutPage } from '@/pages/AboutPage';
import { ContactPage } from '@/pages/ContactPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { PurchaseSuccessPage } from '@/pages/PurchaseSuccessPage';
import { LibraryPage } from '@/pages/LibraryPage';
import { AccountPage } from '@/pages/AccountPage';
import { ReaderPage } from '@/pages/ReaderPage';
import { LegalPage } from '@/pages/LegalPage';

import { AdminLayout } from '@/pages/admin/AdminLayout';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminBooksPage } from '@/pages/admin/AdminBooksPage';
import { AdminBookEditorPage } from '@/pages/admin/AdminBookEditorPage';
import { AdminOrdersPage } from '@/pages/admin/AdminOrdersPage';
import { AdminCustomersPage } from '@/pages/admin/AdminCustomersPage';
import { AdminAccessPage } from '@/pages/admin/AdminAccessPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Reader — full screen, no navbar/footer */}
          <Route path="/read/:token" element={<ReaderPage />} />

          {/* All other routes get navbar + footer */}
          <Route
            path="/*"
            element={
              <div className="flex min-h-screen flex-col">
                <Navbar />
                <main className="flex-1">
                  <Routes>
                    {/* Public */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/books" element={<BooksPage />} />
                    <Route path="/books/:slug" element={<BookDetailPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/privacy" element={<LegalPage type="privacy" />} />
                    <Route path="/terms" element={<LegalPage type="terms" />} />
                    <Route path="/refund" element={<LegalPage type="refund" />} />

                    {/* Auth */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                    {/* Purchase */}
                    <Route path="/purchase-success" element={<PurchaseSuccessPage />} />

                    {/* Customer (protected) */}
                    <Route path="/library" element={
                      <ProtectedRoute><LibraryPage /></ProtectedRoute>
                    } />
                    <Route path="/account" element={
                      <ProtectedRoute><AccountPage /></ProtectedRoute>
                    } />

                    {/* Admin (protected, admin only) */}
                    <Route path="/admin" element={
                      <ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>
                    }>
                      <Route index element={<AdminDashboard />} />
                      <Route path="books" element={<AdminBooksPage />} />
                      <Route path="books/new" element={<AdminBookEditorPage />} />
                      <Route path="books/:id/edit" element={<AdminBookEditorPage />} />
                      <Route path="orders" element={<AdminOrdersPage />} />
                      <Route path="customers" element={<AdminCustomersPage />} />
                      <Route path="access" element={<AdminAccessPage />} />
                    </Route>

                    {/* 404 */}
                    <Route path="*" element={
                      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
                        <h1 className="font-serif text-5xl font-light text-ink-900">404</h1>
                        <p className="mt-4 text-ink-600">This page could not be found.</p>
                        <a href="/" className="btn-primary mt-6">Go Home</a>
                      </div>
                    } />
                  </Routes>
                </main>
                <Footer />
              </div>
            }
          />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
