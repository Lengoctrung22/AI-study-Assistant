import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PiGraduationCapBold } from 'react-icons/pi';
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
      toast.success('Đăng ký thành công!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container fade-in">
        <div className="auth-header">
          <div className="auth-logo"><PiGraduationCapBold /></div>
          <h1>Tạo tài khoản</h1>
          <p>Bắt đầu với AI Study Assistant</p>
        </div>
        <form className="auth-form card" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Họ và tên</label>
            <input className="input" type="text" placeholder="Nguyễn Văn A" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Email</label>
            <input className="input" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Mật khẩu</label>
            <input className="input" type="password" placeholder="Tối thiểu 6 ký tự" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
            {loading ? 'Đang tạo...' : 'Đăng ký'}
          </button>
        </form>
        <div className="auth-footer">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}
