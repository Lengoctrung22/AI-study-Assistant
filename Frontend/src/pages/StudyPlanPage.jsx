import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { HiOutlineCalendarDays, HiOutlineFire, HiOutlineClock, HiOutlineCheckCircle, HiOutlineTrash } from 'react-icons/hi2';
import { PiCrownBold } from 'react-icons/pi';

export default function StudyPlanPage() {
  const { user } = useAuth();
  const isPremium = user?.plan === 'premium';
  const [plans, setPlans] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [streak, setStreak] = useState(null);
  const [srDashboard, setSrDashboard] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', documentIds: [], targetDate: '', dailyHours: 2 });

  useEffect(() => {
    if (!isPremium) return;
    api.get('/documents').then(r => setDocuments(r.data.documents?.filter(d => d.status === 'ready') || [])).catch(console.error);
    api.get('/study-plan').then(r => setPlans(r.data.studyPlans || [])).catch(console.error);
    api.get('/study-plan/streak').then(r => setStreak(r.data)).catch(console.error);
    api.get('/study-plan/sr-dashboard').then(r => setSrDashboard(r.data)).catch(console.error);
    api.get('/study-plan/heatmap').then(r => setHeatmap(r.data.heatmap || [])).catch(console.error);
  }, [isPremium]);

  const createPlan = async () => {
    if (form.documentIds.length === 0 || !form.targetDate) return;
    setLoading(true);
    try {
      const r = await api.post('/study-plan/generate', form);
      setPlans(p => [r.data.studyPlan, ...p]);
      setShowCreate(false);
      setForm({ title: '', documentIds: [], targetDate: '', dailyHours: 2 });
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const toggleTask = async (planId, dayIndex, taskIndex) => {
    try {
      const r = await api.put(`/study-plan/${planId}/task`, { dayIndex, taskIndex });
      setPlans(p => p.map(plan => plan._id === planId ? r.data.studyPlan : plan));
      if (selectedPlan?._id === planId) setSelectedPlan(r.data.studyPlan);
    } catch (e) { console.error(e); }
  };

  const deletePlan = async (planId) => {
    try {
      await api.delete(`/study-plan/${planId}`);
      setPlans(p => p.filter(plan => plan._id !== planId));
      if (selectedPlan?._id === planId) setSelectedPlan(null);
    } catch (e) { console.error(e); }
  };

  if (!isPremium) {
    return (
      <div className="page-container fade-in">
        <div className="premium-gate">
          <div className="premium-gate-icon"><PiCrownBold /></div>
          <h2>Kế hoạch học tập</h2>
          <p>Nâng cấp Premium để tạo kế hoạch học tập AI và theo dõi tiến trình.</p>
          <div className="premium-features-list">
            <div className="premium-feature-item">📅 Kế hoạch học tập AI</div>
            <div className="premium-feature-item">🔥 Chuỗi ngày học liên tục</div>
            <div className="premium-feature-item">📊 Dashboard Spaced Repetition</div>
            <div className="premium-feature-item">🗓️ Heatmap hoạt động</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1><HiOutlineCalendarDays style={{ marginRight: 8 }} /> Kế hoạch học tập</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Tạo kế hoạch</button>
      </div>

      {/* Stats Row */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}><HiOutlineFire /></div>
          <div><div className="stat-value">{streak?.currentStreak || 0}</div><div className="stat-label">Streak hiện tại</div></div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}><HiOutlineClock /></div>
          <div><div className="stat-value">{streak?.totalHours || 0}h</div><div className="stat-label">Tổng thời gian</div></div>
        </div>
        {srDashboard && (
          <>
            <div className="card stat-card">
              <div className="stat-icon" style={{ background: '#dcfce7', color: '#10b981' }}><HiOutlineCheckCircle /></div>
              <div><div className="stat-value">{srDashboard.dueToday}</div><div className="stat-label">Flashcard cần ôn</div></div>
            </div>
            <div className="card stat-card">
              <div><div className="stat-value">{srDashboard.totalCards}</div><div className="stat-label">Tổng Flashcard</div></div>
            </div>
          </>
        )}
      </div>

      {/* SR Distribution */}
      {srDashboard && (
        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>📊 Phân bổ Flashcard</h3>
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { label: 'Mới', value: srDashboard.distribution.new, color: '#3b82f6' },
              { label: 'Đang học', value: srDashboard.distribution.learning, color: '#f59e0b' },
              { label: 'Thuần thục', value: srDashboard.distribution.mature, color: '#10b981' },
            ].map((item, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: item.color }}>{item.value}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.label}</div>
                <div className="progress-bar" style={{ marginTop: 8 }}>
                  <div className="progress-fill" style={{ width: `${srDashboard.totalCards ? (item.value / srDashboard.totalCards) * 100 : 0}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Heatmap */}
      {heatmap.length > 0 && (
        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>🗓️ Hoạt động học tập</h3>
          <div className="heatmap-grid">
            {heatmap.slice(0, 90).reverse().map((d, i) => (
              <div key={i} className={`heatmap-cell level-${d.level}`} title={`${d.date}: ${d.totalMinutes} phút`} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, fontSize: 12, color: 'var(--text-secondary)', alignItems: 'center' }}>
            <span>Ít</span>
            {[0, 1, 2, 3, 4].map(l => <div key={l} className={`heatmap-cell level-${l}`} style={{ width: 12, height: 12 }} />)}
            <span>Nhiều</span>
          </div>
        </div>
      )}

      {/* Create Plan Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Tạo kế hoạch học tập mới</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
              <div>
                <label style={{ fontWeight: 600, marginBottom: 4, display: 'block' }}>Tiêu đề</label>
                <input className="input-field" placeholder="VD: Ôn thi cuối kỳ" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontWeight: 600, marginBottom: 4, display: 'block' }}>Chọn tài liệu</label>
                {documents.map(d => (
                  <label key={d._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.documentIds.includes(d._id)} onChange={e => {
                      setForm(f => ({ ...f, documentIds: e.target.checked ? [...f.documentIds, d._id] : f.documentIds.filter(id => id !== d._id) }));
                    }} />
                    {d.title}
                  </label>
                ))}
              </div>
              <div>
                <label style={{ fontWeight: 600, marginBottom: 4, display: 'block' }}>Ngày mục tiêu</label>
                <input type="date" className="input-field" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontWeight: 600, marginBottom: 4, display: 'block' }}>Giờ học/ngày: {form.dailyHours}h</label>
                <input type="range" min="1" max="8" step="0.5" value={form.dailyHours} onChange={e => setForm(f => ({ ...f, dailyHours: parseFloat(e.target.value) }))} style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Hủy</button>
                <button className="btn btn-primary" onClick={createPlan} disabled={loading}>{loading ? 'Đang tạo...' : 'Tạo kế hoạch'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan List or Detail */}
      {selectedPlan ? (
        <div>
          <button className="btn btn-secondary" style={{ marginBottom: 16 }} onClick={() => setSelectedPlan(null)}>← Quay lại</button>
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>{selectedPlan.title}</h2>
              <span className={`badge ${selectedPlan.status === 'completed' ? 'badge-success' : 'badge-info'}`}>{selectedPlan.progress}%</span>
            </div>
            <div className="progress-bar" style={{ marginTop: 12 }}><div className="progress-fill" style={{ width: `${selectedPlan.progress}%` }} /></div>
          </div>
          {selectedPlan.dailyPlan?.map((day, dayIdx) => (
            <div key={dayIdx} className={`card ${day.completed ? 'card-completed' : ''}`} style={{ padding: 16, marginBottom: 12 }}>
              <h3 style={{ marginBottom: 12, fontSize: 15 }}>📅 Ngày {day.day} - {day.date}</h3>
              {day.tasks?.map((task, taskIdx) => (
                <label key={taskIdx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', cursor: 'pointer', opacity: task.completed ? 0.6 : 1 }}>
                  <input type="checkbox" checked={task.completed} onChange={() => toggleTask(selectedPlan._id, dayIdx, taskIdx)} />
                  <span style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>{task.description}</span>
                  <span className="badge badge-info" style={{ fontSize: 11, marginLeft: 'auto' }}>{task.duration} phút</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>📋 Kế hoạch của bạn</h2>
          {plans.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon">📅</div>
              <h3>Chưa có kế hoạch</h3>
              <p>Tạo kế hoạch học tập đầu tiên của bạn</p>
            </div>
          ) : (
            <div className="doc-grid">
              {plans.map(plan => (
                <div key={plan._id} className="card doc-card" onClick={() => setSelectedPlan(plan)}>
                  <div className="doc-card-header">
                    <div className="doc-card-icon"><HiOutlineCalendarDays /></div>
                    <div>
                      <div className="doc-card-title">{plan.title}</div>
                      <div className="doc-card-meta">Mục tiêu: {new Date(plan.targetDate).toLocaleDateString('vi-VN')}</div>
                    </div>
                  </div>
                  <div className="progress-bar" style={{ margin: '12px 0' }}><div className="progress-fill" style={{ width: `${plan.progress}%` }} /></div>
                  <div className="doc-card-footer">
                    <span className={`badge ${plan.status === 'completed' ? 'badge-success' : 'badge-info'}`}>{plan.progress}% hoàn thành</span>
                    <button className="btn-ghost" style={{ padding: 4 }} onClick={e => { e.stopPropagation(); deletePlan(plan._id); }}><HiOutlineTrash size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
