import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  PiGraduationCap, 
  PiUser, 
  PiEnvelope, 
  PiLock, 
  PiArrowRight, 
  PiBookOpen, 
  PiCards, 
  PiSparkle 
} from 'react-icons/pi';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error('Mật khẩu tối thiểu 6 ký tự');
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success('Đăng ký thành công! Chào mừng bạn.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại');
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
          <span className="showcase-eyebrow">Học tập hiệu quả hơn</span>
          <h1 className="showcase-title">
            Tạo tài khoản và <span>bắt đầu học tập</span> thông minh
          </h1>
          <p className="showcase-desc">
            Tham gia cùng hàng ngàn học sinh và sinh viên để tối ưu hóa thời gian tự học, nắm vững kiến thức bằng công nghệ AI tiên tiến.
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
            <h2>Tạo tài khoản</h2>
            <p>Bắt đầu với AI Study Assistant</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label>
                <PiUser style={{ fontSize: '15px' }} /> Họ và tên
              </label>
              <div className="auth-input-wrapper">
                <PiUser className="auth-input-icon" />
                <input
                  className="auth-input"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

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
                  placeholder="Tối thiểu 6 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button className="auth-submit-btn" type="submit" disabled={loading}>
              <span>{loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}</span>
              <span className="btn-arrow-wrapper">
                <PiArrowRight />
              </span>
            </button>
          </form>

          <div className="auth-card-footer">
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
