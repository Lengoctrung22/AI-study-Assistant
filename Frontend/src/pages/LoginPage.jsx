import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  PiGraduationCap, 
  PiEnvelope, 
  PiLock, 
  PiArrowRight, 
  PiBookOpen, 
  PiCards, 
  PiSparkle 
} from 'react-icons/pi';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Security: Login attempt throttle (brute-force protection)
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  // Auto-clear lockout after timeout
  useEffect(() => {
    if (lockoutUntil) {
      const timer = setTimeout(() => {
        setLockoutUntil(null);
        setFailedAttempts(0);
      }, lockoutUntil - Date.now());
      return () => clearTimeout(timer);
    }
  }, [lockoutUntil]);

  const isLockedOut = lockoutUntil && Date.now() < lockoutUntil;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLockedOut) {
      const seconds = Math.ceil((lockoutUntil - Date.now()) / 1000);
      toast.error(`Quá nhiều lần thử. Vui lòng đợi ${seconds} giây.`);
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      setFailedAttempts(0);
      toast.success('Đăng nhập thành công!');
      navigate('/');
    } catch (err) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      if (newAttempts >= 5) {
        const lockDuration = 30000; // 30 seconds
        setLockoutUntil(Date.now() + lockDuration);
        toast.error('Quá nhiều lần đăng nhập thất bại. Đã tạm khóa 30 giây.');
      } else {
        toast.error(err.response?.data?.message || 'Email hoặc mật khẩu không đúng');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-layout">
      {/* Background Mesh Gradient Orbs */}
      <div className="auth-mesh-bg">
        <div className="auth-mesh-orb-1"></div>
        <div className="auth-mesh-orb-2"></div>
      </div>

      <div className="auth-container-inner">
        {/* Left: Visual Showcase */}
        <div className="auth-showcase">
        <div className="showcase-brand">
          <div className="showcase-logo">
            <PiGraduationCap />
          </div>
          <span className="showcase-brand-name">AI Study Assistant</span>
        </div>

        <div className="showcase-content">
          <span className="showcase-eyebrow">Trợ lý học tập thông minh</span>
          <h1 className="showcase-title">
            Nâng tầm học tập với sức mạnh <span>trí tuệ nhân tạo</span>
          </h1>
          <p className="showcase-desc">
            Tóm tắt tài liệu, tự động tạo flashcard, tạo đề trắc nghiệm thông minh và lập kế hoạch học tập cá nhân hóa chỉ trong vài giây.
          </p>

          <div className="showcase-previews">
            <div className="preview-pill">
              <div className="preview-icon">
                <PiBookOpen />
              </div>
              <div className="preview-text">
                <h4>Tương tác tài liệu học tập</h4>
                <p>Phân tích PDF, tóm tắt nội dung và đặt câu hỏi trực tiếp với tài liệu.</p>
              </div>
            </div>

            <div className="preview-pill">
              <div className="preview-icon">
                <PiCards />
              </div>
              <div className="preview-text">
                <h4>Ghi nhớ thông minh</h4>
                <p>Hệ thống Flashcard tự sinh tự động giúp ôn tập hiệu quả theo chu kỳ.</p>
              </div>
            </div>

            <div className="preview-pill">
              <div className="preview-icon">
                <PiSparkle />
              </div>
              <div className="preview-text">
                <h4>Đề ôn luyện cá nhân hóa</h4>
                <p>Tạo các câu hỏi trắc nghiệm kiểm tra kiến thức sát với thực tế nhất.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="showcase-footer">
          &copy; {new Date().getFullYear()} AI Study Assistant. Tối ưu hóa việc học của bạn.
        </div>
      </div>

      {/* Right: Form Area */}
      <div className="auth-form-area">
        <div className="auth-form-content">
          <div className="auth-card-header">
            <h2>Chào mừng trở lại</h2>
            <p>Đăng nhập vào AI Study Assistant</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label>
                <PiEnvelope style={{ fontSize: '15px' }} /> Email
              </label>
              <div className="auth-input-wrapper">
                <PiEnvelope className="auth-input-icon" />
                <input
                  className="auth-input"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-form-group" style={{ marginBottom: '24px' }}>
              <label>
                <PiLock style={{ fontSize: '15px' }} /> Mật khẩu
              </label>
              <div className="auth-input-wrapper">
                <PiLock className="auth-input-icon" />
                <input
                  className="auth-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button className="auth-submit-btn" type="submit" disabled={loading || isLockedOut}>
              <span>{loading ? 'Đang đăng nhập...' : isLockedOut ? 'Tạm khóa...' : 'Đăng nhập'}</span>
              <span className="btn-arrow-wrapper">
                <PiArrowRight />
              </span>
            </button>
          </form>

          <div className="auth-card-footer">
            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
