import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import RecipeDetailPage from './pages/RecipeDetailPage'
import CreateRecipePage from './pages/CreateRecipePage'
import EditRecipePage from './pages/EditRecipePage'
import ProfilePage from './pages/ProfilePage'
import FavoritesPage from './pages/FavoritesPage'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main>
        <Routes>
          <Route path="/"              element={<HomePage />} />
          <Route path="/login"         element={<LoginPage />} />
          <Route path="/register"      element={<RegisterPage />} />
          <Route path="/recipes/:id"   element={<RecipeDetailPage />} />
          <Route path="/profile/:id"   element={<ProfilePage />} />
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
