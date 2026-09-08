import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/Home';
import JobsPage from './pages/Jobs';
import CompaniesPage from './pages/Companies';
import ProfilePage from './pages/Profile';
import NewsPage from './pages/News';
import NewsDetail from './pages/NewsDetail';
import JobDetail from './pages/JobDetail';
import CompanyDetail from './pages/CompanyDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import PostJob from './pages/PostJob';
import HRDashboard from './pages/HRDashboard';
import AboutPage from './pages/About';
import { initTheme } from './utils/theme';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    initTheme();
  }, []);

  const navigateTo = (page, params = null) => {
    const path = page === 'home' ? '/' : `/${page}`;
    navigate(path, { state: { params } });
  };

  let currentPage = 'home';
  if (location.pathname.startsWith('/jobs')) currentPage = 'jobs';
  else if (location.pathname.startsWith('/job/')) currentPage = 'jobs';
  else if (location.pathname.startsWith('/companies')) currentPage = 'companies';
  else if (location.pathname.startsWith('/company/')) currentPage = 'companies';
  else if (location.pathname.startsWith('/profile')) currentPage = 'profile';
  else if (location.pathname.startsWith('/news')) currentPage = 'news';

  const hideHeader = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="min-h-screen font-sans flex flex-col bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-colors duration-200">
      <ScrollToTop />
      {!hideHeader && <Header currentPage={currentPage} setPage={navigateTo} />}
      <Routes>
        <Route path="/" element={<HomePage navigateTo={navigateTo} />} />
        <Route path="/jobs" element={<JobsWrapper />} />
        <Route path="/job/:id" element={<JobDetail />} />
        <Route path="/companies" element={<CompaniesWrapper />} />
        <Route path="/company/:id" element={<CompanyDetail />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:id" element={<NewsDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/post-job" element={<PostJob />} />
        <Route path="/hr-dashboard" element={<HRDashboard />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
      {!hideHeader && <Footer />}
    </div>
  );
}

const JobsWrapper = () => {
  const location = useLocation();
  return <JobsPage initialParams={location.state?.params} />;
};

const CompaniesWrapper = () => {
  const location = useLocation();
  return <CompaniesPage initialParams={location.state?.params} />;
};

export default App;
