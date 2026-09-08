import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { registerUser } from '../services/authService';
import { User, Building2, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('role') === 'hr' ? 'hr' : 'candidate';
  });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Vui lòng nhập họ và tên của bạn.');
      return;
    }

    if (!trimmedEmail) {
      setError('Vui lòng nhập email.');
      return;
    }

    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp. Vui lòng nhập lại!');
      return;
    }

    setLoading(true);

    const userRole = role === 'hr' ? 'hr' : 'candidate';
    const displayName = trimmedName;

    try {
      await registerUser(trimmedEmail, password, displayName, userRole);

      // Navigate to login with success message and prefilled email
      navigate('/login', { 
        state: { 
          registeredEmail: trimmedEmail, 
          successMsg: `Đăng ký tài khoản ${userRole === 'hr' ? 'Nhà tuyển dụng' : 'Ứng viên'} thành công! Vui lòng đăng nhập.` 
        } 
      });
    } catch (err) {
      console.error('Registration error:', err);
      let msg = 'Đã có lỗi xảy ra khi đăng ký. Vui lòng thử lại!';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'Email này đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Mật khẩu quá yếu.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Email không hợp lệ.';
      } else if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
        msg = 'Tính năng đăng ký đang tạm thời bảo trì hoặc chưa bật Email Auth trên Firebase Console.';
      }
      setError(msg);
      setLoading(false);
    }
  };

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-slate-950 relative">
      <button 
        onClick={() => navigate('/')} 
        className="absolute top-6 left-6 flex items-center gap-1.5 text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium text-sm cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Trang chủ</span>
      </button>

      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl dark:shadow-none overflow-hidden border border-gray-100 dark:border-slate-800 mt-8 sm:mt-0">
        <div className="p-6 sm:p-10">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1.5">Đăng ký tài khoản</h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
              Cùng Jobs <span className="font-bold text-blue-600 dark:text-blue-400">VN</span> kết nối cơ hội nghề nghiệp
            </p>
          </div>

          {/* Role Selection Tabs */}
          <div className="mb-6 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setRole('candidate')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                role === 'candidate' 
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' 
                  : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Ứng viên tìm việc</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('hr')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                role === 'hr' 
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' 
                  : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Nhà tuyển dụng</span>
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-300 text-xs sm:text-sm rounded-xl border border-red-100 dark:border-red-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleRegister} autoComplete="off" data-lpignore="true" data-form-type="other">
            {/* Hidden dummy decoy fields to consume browser auto-fill heuristics */}
            <input type="text" name="fake_user_name_decoy" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
            <input type="password" name="fake_password_decoy" style={{ display: 'none' }} tabIndex={-1} autoComplete="new-password" />

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-slate-300 mb-1" htmlFor="reg_name">
                {role === 'hr' ? 'Họ và tên Người đại diện / HR' : 'Họ và tên Ứng viên'}
              </label>
              <input
                id="reg_name"
                name="reg_fullname_unique"
                type="text"
                required
                autoComplete="off"
                spellCheck="false"
                data-lpignore="true"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 sm:py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm"
                placeholder={role === 'hr' ? 'VD: Nguyễn Thị HR Manager' : 'VD: Nguyễn Văn A'}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-slate-300 mb-1" htmlFor="reg_email">
                Email {role === 'hr' ? 'Doanh nghiệp / Tuyển dụng' : 'Cá nhân'}
              </label>
              <input
                id="reg_email"
                name="reg_email_unique"
                type="email"
                required
                autoComplete="off"
                spellCheck="false"
                data-lpignore="true"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 sm:py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm"
                placeholder={role === 'hr' ? 'VD: tuyendung@congty.com' : 'VD: nguyenvana@gmail.com'}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-slate-300 mb-1" htmlFor="reg_password">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="reg_password"
                  name="reg_pwd_field"
                  type="text"
                  style={{ WebkitTextSecurity: showPassword ? 'none' : 'disc' }}
                  required
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 sm:py-3 pr-11 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm"
                  placeholder="Tạo mật khẩu (Ít nhất 8 ký tự)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 p-1 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-slate-300 mb-1" htmlFor="reg_confirm_password">
                Nhập lại mật khẩu
              </label>
              <div className="relative">
                <input
                  id="reg_confirm_password"
                  name="reg_confirm_pwd_field"
                  type="text"
                  style={{ WebkitTextSecurity: showConfirmPassword ? 'none' : 'disc' }}
                  required
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 sm:py-3 pr-11 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm"
                  placeholder="Nhập lại mật khẩu để xác nhận"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 p-1 cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-all mt-4 disabled:opacity-60 cursor-pointer active:scale-98"
            >
              {loading ? 'Đang xử lý đăng ký...' : `Đăng ký tài khoản ${role === 'hr' ? 'Nhà tuyển dụng' : 'Ứng viên'}`}
            </button>
          </form>

          <div className="mt-6 text-center text-xs sm:text-sm text-gray-600 dark:text-slate-400">
            Đã có tài khoản?{' '}
            <button onClick={() => navigate('/login')} className="font-bold text-blue-600 dark:text-blue-400 hover:underline transition-colors cursor-pointer">
              Đăng nhập ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
