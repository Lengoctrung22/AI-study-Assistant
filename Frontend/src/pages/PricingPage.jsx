import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineCheck, HiOutlineXMark, HiOutlineCreditCard, HiOutlineShieldCheck, HiOutlineSparkles, HiOutlineLockClosed, HiOutlineArrowLeft, HiOutlineDocumentDuplicate, HiOutlineQrCode } from 'react-icons/hi2';
import { PiCrownBold } from 'react-icons/pi';

const FREE_FEATURES = [
  { text: 'Upload tài liệu PDF', included: true },
  { text: 'Tạo Flashcards (giới hạn)', included: true },
  { text: 'Tạo Quiz (giới hạn)', included: true },
  { text: 'Chat AI cơ bản', included: true },
  { text: 'Phân tích tài liệu nâng cao', included: false },
  { text: 'Kế hoạch học tập AI', included: false },
  { text: 'AI Tools (Mind Map, Glossary...)', included: false },
  { text: 'Hỗ trợ ưu tiên', included: false },
];

const PREMIUM_FEATURES = [
  { text: 'Upload tài liệu PDF', included: true },
  { text: 'Tạo Flashcards không giới hạn', included: true },
  { text: 'Tạo Quiz không giới hạn', included: true },
  { text: 'Chat AI nâng cao (Tutor cá nhân)', included: true },
  { text: 'Phân tích tài liệu nâng cao', included: true },
  { text: 'Kế hoạch học tập AI', included: true },
  { text: 'AI Tools (Mind Map, Glossary...)', included: true },
  { text: 'Hỗ trợ ưu tiên', included: true },
];

const PRICES = {
  monthly: 99000,
  yearly: 799000,
};

const formatVND = (amount) => {
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
};

export default function PricingPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const isPremium = user?.plan === 'premium';

  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('form'); // 'form' | 'processing' | 'success'
  const [paymentResult, setPaymentResult] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Payment method: 'card' | 'qr'
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [qrData, setQrData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setPlansLoading(true);
        const res = await api.get('/payments/plans');
        setPlans(res.data.plans || []);
      } catch (err) {
        console.error(err);
        toast.error('Không thể tải danh sách gói dịch vụ');
      } finally {
        setPlansLoading(false);
      }
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    if (isPremium) {
      loadPaymentHistory();
    }
  }, [isPremium]);

  useEffect(() => {
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [pollingInterval]);

  const loadPaymentHistory = async () => {
    try {
      const res = await api.get('/payments/history');
      setPaymentHistory(res.data.payments || []);
    } catch (err) {
      console.error(err);
    }
  };

  const startQRPolling = (txnId) => {
    if (pollingInterval) clearInterval(pollingInterval);

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/payments/status/${txnId}`);
        if (res.data.status === 'completed') {
          clearInterval(interval);
          setPollingInterval(null);
          setPaymentResult(res.data);
          updateUser(res.data.user);
          setCheckoutStep('success');
        }
      } catch (err) {
        console.error('Polling status error:', err);
      }
    }, 3000);

    setPollingInterval(interval);
  };

  const handleQRInit = async () => {
    if (!selectedPlan) return;
    setQrLoading(true);
    try {
      const res = await api.post('/payments/qr-init', { plan: selectedPlan.code });
      setQrData(res.data);
      startQRPolling(res.data.transactionId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể khởi tạo mã QR thanh toán');
      setPaymentMethod('card');
    } finally {
      setQrLoading(false);
    }
  };

  const handleMethodChange = (method) => {
    setPaymentMethod(method);
    if (method === 'qr') {
      handleQRInit();
    } else {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      setQrData(null);
    }
  };

  // Format card number with spaces
  const handleCardNumberChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // Format expiry as MM/YY
  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 3) val = val.slice(0, 2) + '/' + val.slice(2);
    setExpiry(val);
  };

  // Detect card brand for preview
  const getCardBrand = () => {
    const num = cardNumber.replace(/\s/g, '');
    if (/^4/.test(num)) return 'VISA';
    if (/^5[1-5]/.test(num)) return 'MC';
    if (/^3[47]/.test(num)) return 'AMEX';
    if (/^9704/.test(num)) return 'NAPAS';
    return '';
  };

  const handleCheckout = async () => {
    if (!selectedPlan) return;
    if (!cardNumber || !cardName || !expiry || !cvv) {
      toast.error('Vui lòng điền đầy đủ thông tin thẻ');
      return;
    }

    setCheckoutStep('processing');

    try {
      const res = await api.post('/payments/checkout', {
        plan: selectedPlan.code,
        cardNumber: cardNumber.replace(/\s/g, ''),
        cardName,
        expiry,
        cvv,
        method: 'card',
      });

      setPaymentResult(res.data);
      updateUser(res.data.user);
      setCheckoutStep('success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Thanh toán thất bại. Vui lòng thử lại.';
      toast.error(msg);
      setCheckoutStep('form');
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy gói Premium? Bạn sẽ mất quyền truy cập các tính năng Premium ngay lập tức.')) return;
    setCancelling(true);
    try {
      const res = await api.post('/payments/cancel-subscription');
      updateUser(res.data.user);
      toast.success(res.data.message);
      setPaymentHistory([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể hủy gói');
    } finally {
      setCancelling(false);
    }
  };

  const closeCheckout = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setShowCheckout(false);
    setCheckoutStep('form');
    setPaymentResult(null);
    setCardNumber('');
    setCardName('');
    setExpiry('');
    setCvv('');
    setQrData(null);
    setPaymentMethod('card');
  };

  const monthlySaving = Math.round((PRICES.monthly * 12 - PRICES.yearly) / (PRICES.monthly * 12) * 100);

  return (
    <div className="page-container fade-in">
      {/* Back button */}
      <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        <HiOutlineArrowLeft /> Quay lại
      </button>

      {/* Header */}
      <div className="pricing-header">
        <div className="pricing-badge">
          <PiCrownBold /> Premium
        </div>
        <h1 className="pricing-title">Chọn gói phù hợp với bạn</h1>
        <p className="pricing-subtitle">
          Nâng cấp để mở khóa toàn bộ tính năng AI học tập thông minh
        </p>
      </div>

      {/* If already premium — show current plan info */}
      {isPremium && (
        <div className="current-plan-card">
          <div className="current-plan-header">
            <div className="current-plan-icon">
              <PiCrownBold />
            </div>
            <div>
              <h3>Bạn đang sử dụng gói Premium</h3>
              <p>
                Gói {user.subscriptionType === 'yearly' ? 'Năm' : user.subscriptionType === 'monthly' ? 'Tháng' : user.subscriptionType || 'Premium'}
                {user.premiumExpiresAt && ` • Hết hạn: ${new Date(user.premiumExpiresAt).toLocaleDateString('vi-VN')}`}
              </p>
            </div>
          </div>
          <div className="current-plan-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => setShowHistory(!showHistory)}>
              {showHistory ? 'Ẩn lịch sử' : 'Lịch sử thanh toán'}
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleCancelSubscription} disabled={cancelling}>
              {cancelling ? 'Đang hủy...' : 'Hủy gói Premium'}
            </button>
          </div>

          {/* Payment History */}
          {showHistory && paymentHistory.length > 0 && (
            <div className="payment-history">
              <h4>Lịch sử giao dịch</h4>
              {paymentHistory.map((p) => (
                <div className="payment-history-item" key={p._id}>
                  <div className="payment-info">
                    <span className="payment-desc">{p.description || 'Giao dịch'}</span>
                    <span className="payment-date">{new Date(p.createdAt).toLocaleDateString('vi-VN')} {new Date(p.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="payment-meta">
                    <span className={`badge ${p.status === 'completed' ? 'badge-success' : p.status === 'cancelled' ? 'badge-warning' : 'badge-danger'}`}>
                      {p.status === 'completed' ? 'Thành công' : p.status === 'cancelled' ? 'Đã hủy' : 'Thất bại'}
                    </span>
                    {p.amount > 0 && <span className="payment-amount">{formatVND(p.amount)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pricing Cards */}
      {!isPremium && (
        <>
          <div className="pricing-cards" style={{ marginTop: '32px' }}>
            {/* Free Plan */}
            <div className="pricing-card">
              <div className="pricing-card-header">
                <h3>Miễn phí</h3>
                <p className="pricing-card-desc">Trải nghiệm cơ bản</p>
              </div>
              <div className="pricing-card-price">
                <span className="price-amount">0₫</span>
                <span className="price-period">/ mãi mãi</span>
              </div>
              <ul className="pricing-features">
                {FREE_FEATURES.map((f, i) => (
                  <li key={i} className={f.included ? '' : 'disabled'}>
                    {f.included
                      ? <HiOutlineCheck className="feature-check" />
                      : <HiOutlineXMark className="feature-x" />
                    }
                    {f.text}
                  </li>
                ))}
              </ul>
              <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} disabled>
                Gói hiện tại
              </button>
            </div>

            {/* Dynamic Premium Plans */}
            {plansLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '280px', padding: '40px 0' }}>
                <div className="spinner" style={{ marginBottom: '12px' }} />
                <p style={{ color: 'var(--text-secondary)' }}>Đang tải các gói học tập...</p>
              </div>
            ) : (
              plans.filter(p => p.isActive).map((pkg) => (
                <div className={`pricing-card ${pkg.code === 'yearly' ? 'premium' : ''}`} key={pkg._id}>
                  {pkg.code === 'yearly' && <div className="popular-badge">Phổ biến nhất ⭐</div>}
                  <div className="pricing-card-header">
                    <h3>
                      <PiCrownBold style={{ color: '#f59e0b', marginRight: 6 }} />
                      {pkg.name}
                    </h3>
                    <p className="pricing-card-desc">{pkg.description || 'Mở khóa toàn bộ sức mạnh AI'}</p>
                  </div>
                  <div className="pricing-card-price">
                    <span className="price-amount">{formatVND(pkg.price)}</span>
                    <span className="price-period">/ {pkg.durationMonths} tháng</span>
                  </div>
                  <ul className="pricing-features">
                    {pkg.features.map((feat, idx) => (
                      <li key={idx}>
                        <HiOutlineCheck className="feature-check premium-check" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <button
                    className="btn btn-premium-cta"
                    onClick={() => {
                      setSelectedPlan(pkg);
                      setShowCheckout(true);
                    }}
                  >
                    <HiOutlineSparkles /> Nâng cấp ngay
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Trust badges */}
          <div className="trust-section">
            <div className="trust-item">
              <HiOutlineShieldCheck />
              <span>Thanh toán an toàn & bảo mật</span>
            </div>
            <div className="trust-item">
              <HiOutlineLockClosed />
              <span>Hủy bất cứ lúc nào</span>
            </div>
            <div className="trust-item">
              <HiOutlineCreditCard />
              <span>Hỗ trợ Visa, Mastercard, Napas</span>
            </div>
          </div>
        </>
      )}

      {/* Checkout Modal */}
      {showCheckout && selectedPlan && (
        <div className="modal-overlay" onClick={closeCheckout}>
          <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
            {checkoutStep === 'form' && (
              <>
                <div className="checkout-header">
                  <h2>Thanh toán</h2>
                  <button className="modal-close" onClick={closeCheckout}>×</button>
                </div>

                {/* Order Summary */}
                <div className="checkout-summary">
                  <div className="summary-row">
                    <span>{selectedPlan.name}</span>
                    <span className="summary-price">{formatVND(selectedPlan.price)}</span>
                  </div>
                  <div className="summary-divider" />
                  <div className="summary-row total">
                    <span>Tổng cộng</span>
                    <span className="summary-price">{formatVND(selectedPlan.price)}</span>
                  </div>
                </div>

                {/* Payment Method Tabs */}
                <div className="payment-method-tabs">
                  <button
                    className={`method-tab ${paymentMethod === 'card' ? 'active' : ''}`}
                    onClick={() => handleMethodChange('card')}
                  >
                    <HiOutlineCreditCard />
                    <span>Thẻ quốc tế</span>
                  </button>
                  <button
                    className={`method-tab ${paymentMethod === 'qr' ? 'active' : ''}`}
                    onClick={() => handleMethodChange('qr')}
                  >
                    <HiOutlineQrCode />
                    <span>Mã QR / Chuyển khoản</span>
                  </button>
                </div>

                {paymentMethod === 'card' ? (
                  <>
                    {/* Credit Card Preview */}
                    <div className="card-preview">
                      <div className="card-preview-inner">
                        <div className="card-preview-brand">{getCardBrand() || 'CARD'}</div>
                        <div className="card-preview-number">
                          {cardNumber || '•••• •••• •••• ••••'}
                        </div>
                        <div className="card-preview-bottom">
                          <div>
                            <div className="card-preview-label">Chủ thẻ</div>
                            <div className="card-preview-value">{cardName || 'NGUYEN VAN A'}</div>
                          </div>
                          <div>
                            <div className="card-preview-label">Hết hạn</div>
                            <div className="card-preview-value">{expiry || 'MM/YY'}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Form */}
                    <div className="checkout-form">
                      <div className="input-group">
                        <label>Số thẻ</label>
                        <input
                          className="input"
                          type="text"
                          placeholder="4242 4242 4242 4242"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          maxLength={19}
                        />
                      </div>
                      <div className="input-group">
                        <label>Tên chủ thẻ</label>
                        <input
                          className="input"
                          type="text"
                          placeholder="NGUYEN VAN A"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value.toUpperCase())}
                        />
                      </div>
                      <div className="checkout-form-row">
                        <div className="input-group">
                          <label>Ngày hết hạn</label>
                          <input
                            className="input"
                            type="text"
                            placeholder="MM/YY"
                            value={expiry}
                            onChange={handleExpiryChange}
                            maxLength={5}
                          />
                        </div>
                        <div className="input-group">
                          <label>CVV</label>
                          <input
                            className="input"
                            type="password"
                            placeholder="•••"
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            maxLength={4}
                          />
                        </div>
                      </div>
                    </div>

                    <button className="btn btn-premium-cta checkout-pay-btn" onClick={handleCheckout}>
                      <HiOutlineLockClosed /> Thanh toán {formatVND(selectedPlan.price)}
                    </button>
                  </>
                ) : (
                  <div className="qr-checkout-container">
                    {qrLoading ? (
                      <div className="qr-loading-spinner">
                        <div className="processing-spinner" />
                        <p>Đang tạo mã thanh toán...</p>
                      </div>
                    ) : qrData ? (
                      <>
                        <div className="qr-image-wrapper">
                          <img src={qrData.qrUrl} alt="Mã thanh toán QR" className="qr-code-img" />
                          <div className="qr-status-badge">
                            <span className="pulse-dot"></span>
                            <span>Đang chờ chuyển khoản...</span>
                          </div>
                        </div>

                        <div className="qr-instructions">
                          <p>Mở ứng dụng Ngân hàng của bạn quét mã QR ở trên hoặc chuyển khoản thủ công theo thông tin:</p>
                        </div>

                        <div className="qr-details-card">
                          <div className="qr-detail-item">
                            <span className="qr-detail-label">Ngân hàng</span>
                            <span className="qr-detail-value">{qrData.bankName}</span>
                          </div>
                          <div className="qr-detail-item">
                            <span className="qr-detail-label">Số tài khoản</span>
                            <span className="qr-detail-value">
                              {qrData.accountNo}
                              <button className="btn-copy-mini" onClick={() => {
                                navigator.clipboard.writeText(qrData.accountNo);
                                toast.success('Đã sao chép số tài khoản');
                              }}>
                                <HiOutlineDocumentDuplicate />
                              </button>
                            </span>
                          </div>
                          <div className="qr-detail-item">
                            <span className="qr-detail-label">Tên tài khoản</span>
                            <span className="qr-detail-value">{qrData.accountName}</span>
                          </div>
                          <div className="qr-detail-item">
                            <span className="qr-detail-label">Số tiền</span>
                            <span className="qr-detail-value text-premium">
                              {formatVND(qrData.amount)}
                              <button className="btn-copy-mini" onClick={() => {
                                navigator.clipboard.writeText(qrData.amount);
                                toast.success('Đã sao chép số tiền');
                              }}>
                                <HiOutlineDocumentDuplicate />
                              </button>
                            </span>
                          </div>
                          <div className="qr-detail-item">
                            <span className="qr-detail-label">Nội dung</span>
                            <span className="qr-detail-value memo-value">
                              {qrData.memo}
                              <button className="btn-copy-mini" onClick={() => {
                                navigator.clipboard.writeText(qrData.memo);
                                toast.success('Đã sao chép nội dung chuyển khoản');
                              }}>
                                <HiOutlineDocumentDuplicate />
                              </button>
                            </span>
                          </div>
                        </div>
                        <p className="qr-disclaimer-text">
                          ⚠️ <strong>Quan trọng:</strong> Vui lòng giữ đúng nội dung chuyển khoản để hệ thống tự động xác nhận sau khi nhận được tiền.
                        </p>
                      </>
                    ) : (
                      <p className="qr-error-msg">Không thể tải thông tin QR. Vui lòng thử lại.</p>
                    )}
                  </div>
                )}

                <p className="checkout-disclaimer">
                  🔒 Giao dịch an toàn và bảo mật. Đây là thanh toán mô phỏng cho mục đích demo.
                </p>
              </>
            )}

            {checkoutStep === 'processing' && (
              <div className="checkout-processing">
                <div className="processing-spinner" />
                <h3>Đang xử lý thanh toán...</h3>
                <p>Vui lòng không đóng cửa sổ này</p>
              </div>
            )}

            {checkoutStep === 'success' && paymentResult && (
              <div className="checkout-success">
                <div className="success-checkmark">
                  <div className="checkmark-circle">
                    <HiOutlineCheck />
                  </div>
                </div>
                <h2>Thanh toán thành công! 🎉</h2>
                <p className="success-subtitle">Chào mừng bạn đến với Premium!</p>

                <div className="success-details">
                  <div className="success-detail-row">
                    <span>Mã giao dịch</span>
                    <span className="detail-value">{paymentResult.payment?.transactionId}</span>
                  </div>
                  <div className="success-detail-row">
                    <span>Gói</span>
                    <span className="detail-value">{plans.find(p => p.code === paymentResult.payment?.plan)?.name || `Premium (${paymentResult.payment?.plan})`}</span>
                  </div>
                  <div className="success-detail-row">
                    <span>Số tiền</span>
                    <span className="detail-value">{formatVND(paymentResult.payment?.amount)}</span>
                  </div>
                  <div className="success-detail-row">
                    <span>Phương thức</span>
                    <span className="detail-value">
                      {paymentResult.payment?.cardBrand
                        ? `${paymentResult.payment.cardBrand} •••• ${paymentResult.payment.cardLast4}`
                        : 'Chuyển khoản QR (VietQR)'
                      }
                    </span>
                  </div>
                </div>

                <button className="btn btn-primary" onClick={() => { closeCheckout(); navigate('/'); }} style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
                  Bắt đầu khám phá Premium
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
