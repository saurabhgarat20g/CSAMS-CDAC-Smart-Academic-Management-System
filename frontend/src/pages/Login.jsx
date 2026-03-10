import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import UpdateProfileModal from '../components/UpdateProfileModal';


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentEmail, setCurrentEmail] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      
      // Check if first login - show profile update modal
      if (user.firstLogin) {
        setCurrentEmail(user.email);
        setShowProfileModal(true);
        return; // Don't navigate yet
      }
      
      // Normal navigation for non-first-time users
      if (user.roles.includes('ROLE_ADMIN')) {
        navigate('/admin');
      } else if (user.roles.includes('ROLE_FACULTY')) {
        navigate('/faculty');
      } else if (user.roles.includes('ROLE_STUDENT')) {
        navigate('/student');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  const handleProfileUpdateSuccess = () => {
    // Redirect to login after profile update
    setShowProfileModal(false);
    setEmail('');
    setPassword('');
    setError('');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-slate-200 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
      {showProfileModal && (
        <UpdateProfileModal 
          currentEmail={currentEmail}
          onSuccess={handleProfileUpdateSuccess}
        />
      )}
      
      <div className="bg-white dark:bg-slate-800 p-8 md:p-10 rounded-2xl shadow-xl w-full max-w-md relative transition-all duration-300 border border-transparent dark:border-slate-700 hover:shadow-2xl hover:-translate-y-1">
        <div className="absolute top-5 right-5">
          <ThemeToggle />
        </div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">Welcome Back</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Login to CDAC Management Portal</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 text-sm rounded-r shadow-sm animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none placeholder-slate-400"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none placeholder-slate-400"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Login to Account
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wide">
            Secure enterprise access
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
