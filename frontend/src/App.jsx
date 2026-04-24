import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop';
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import TermsOfUse from './pages/TermsOfUse';
import RegisterPage from './pages/RegisterPage'
import RecipeDetailPage from './pages/RecipeDetailPage'
import CreateRecipePage from './pages/CreateRecipePage'
import EditRecipePage from './pages/EditRecipePage'
import ProfilePage from './pages/ProfilePage'
import FavoritesPage from './pages/FavoritesPage'
import About from './pages/About'
import Contact from './pages/Contact';


const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <div className="min-h-screen bg-cream">
      <ScrollToTop />
      <Navbar />
      <main>
        <Routes>
          <Route path="/"              element={<HomePage />} />
          <Route path="/login"         element={<LoginPage />} />
          <Route path="/register"      element={<RegisterPage />} />
          <Route path="/recipes/:id"   element={<RecipeDetailPage />} />
          <Route path="/profile/:id"   element={<ProfilePage />} />
          <Route path="/about"         element={<About />} />
          <Route path="/contact"         element={<Contact/>} />
          <Route path="/termsofuse"      element={<TermsOfUse/>} />
          <Route path="/create"        element={<ProtectedRoute><CreateRecipePage /></ProtectedRoute>} />
          <Route path="/edit/:id"      element={<ProtectedRoute><EditRecipePage /></ProtectedRoute>} />
          <Route path="/favorites"     element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
          <Route path="*"              element={<Navigate to="/" replace />} />
        </Routes>
      </main>
       <Footer/> 
    </div>
  )
}
