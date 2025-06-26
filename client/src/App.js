import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SiteHeader from './components/SiteHeader';
import LandingPage from './pages/LandingPage';
import AdminPage from './pages/AdminPage';
import PlayerPage from './pages/PlayerPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import NavBar from './components/NavBar';


function App() {
  return (
    <Router>
      <SiteHeader />      <NavBar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/player" element={<PlayerPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;