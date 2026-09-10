import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLayout } from '../context/LayoutContext';
import api from '../services/api';
import { 
  HiOutlineRectangleStack, 
  HiOutlineClipboardDocumentCheck, 
  HiOutlineChatBubbleLeftRight,
  HiOutlineSparkles,
  HiOutlineCalendarDays,
  HiOutlineCheck,
  HiOutlineArrowRight,
  HiOutlineFire,
  HiOutlineCloudArrowUp,
  HiOutlineArrowUpRight,
  HiOutlineBolt
} from 'react-icons/hi2';
import { PiCrownBold } from 'react-icons/pi';

export default function DashboardPage() {
  const { user } = useAuth();
  const { openCommandPalette } = useLayout();
  const navigate = useNavigate();
  const isPremium = user?.plan === 'premium';

  // State for stats and data
  const [stats, setStats] = useState({ documents: 0, flashcards: 0, quizzes: 0, chats: 0 });
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Premium / Study Plan data states
  const [activePlan, setActivePlan] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [planProgress, setPlanProgress] = useState(0);
  const [streakInfo, setStreakInfo] = useState({ currentStreak: 0, longestStreak: 0, totalStudyDays: 0, totalMinutes: 0 });
  const [heatmapData, setHeatmapData] = useState([]);
  const [quizStats, setQuizStats] = useState({ averageScore: 0, total: 0, trend: 0, lastScore: 0 });

  // UI state
  const [daysCount, setDaysCount] = useState(7); // 7 or 30 days
  const [hoveredBar, setHoveredBar] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch core data
        const [docsRes, fcRes, quizRes, chatRes] = await Promise.all([
          api.get('/documents').catch(() => ({ data: { documents: [] } })),
          api.get('/flashcards').catch(() => ({ data: { flashcardSets: [] } })),
          api.get('/quiz').catch(() => ({ data: { quizzes: [] } })),
          api.get('/chat/sessions').catch(() => ({ data: { sessions: [] } }))
        ]);

        const rawDocs = docsRes.data.documents || [];
        const rawFc = fcRes.data.flashcardSets || [];
        const rawQuizzes = quizRes.data.quizzes || [];
        const rawChats = chatRes.data.sessions || [];

        setStats({
          documents: rawDocs.length,
          flashcards: rawFc.length,
          quizzes: rawQuizzes.length,
          chats: rawChats.length,
        });

        // Recent documents
        setRecentDocs(rawDocs.slice(0, 6));

        // Process Quiz stats for real user data
        const completedQuizzes = rawQuizzes.filter(q => q.status === 'completed');
        if (completedQuizzes.length > 0) {
          const totalScorePercent = completedQuizzes.reduce((sum, q) => {
            const total = q.result?.total || q.questions?.length || 1;
            const score = q.result?.score || 0;
            return sum + (score / total) * 100;
          }, 0);
          const avg = Math.round(totalScorePercent / completedQuizzes.length);

          const lastQ = completedQuizzes[0];
          const lastScore = Math.round(((lastQ.result?.score || 0) / (lastQ.result?.total || lastQ.questions?.length || 1)) * 100);

          let trend = 0;
          if (completedQuizzes.length >= 2) {
            const last3 = completedQuizzes.slice(0, 3);
            const last3Avg = last3.reduce((sum, q) => sum + ((q.result?.score || 0) / (q.result?.total || 1)) * 100, 0) / last3.length;
            trend = Math.round(last3Avg - avg);
          }

          setQuizStats({
            averageScore: avg,
            total: completedQuizzes.length,
            trend: trend,
            lastScore: lastScore
          });
        } else {
          setQuizStats({
            averageScore: 0,
            total: 0,
            trend: 0,
            lastScore: 0
          });
        }

        // Fetch Streak Info and Heatmap Data
        try {
          const [streakRes, heatmapRes] = await Promise.all([
            api.get('/study-plan/streak'),
            api.get('/study-plan/heatmap')
          ]);
          
          if (streakRes.data) {
            const streakData = streakRes.data;
            setStreakInfo({
              currentStreak: streakData.currentStreak || 0,
              longestStreak: streakData.longestStreak || 0,
              totalStudyDays: streakData.totalStudyDays || 0,
              totalMinutes: streakData.totalMinutes || 0
            });
          }

          if (heatmapRes.data) {
            setHeatmapData(heatmapRes.data.heatmap || []);
          }
        } catch (statsErr) {
          console.warn("Activity stats info unavailable:", statsErr.message);
        }

        // Fetch Premium Plan Data
        if (isPremium) {
          const results = await Promise.allSettled([
            api.get('/study-plan'),
            api.get('/quiz/analytics')
          ]);

          if (results[0].status === 'fulfilled') {
            const plans = results[0].value.data.studyPlans || [];
            const active = plans.find(p => p.status === 'active');
            if (active) {
              setActivePlan(active);
              const todayStr = new Date().toLocaleDateString('en-CA');
              let todayDay = active.dailyPlan?.find(d => d.date === todayStr);
              if (!todayDay) {
                todayDay = active.dailyPlan?.find(d => !d.completed);
              }

              if (todayDay) {
                setTodayTasks(todayDay.tasks || []);
                const completed = (todayDay.tasks || []).filter(t => t.completed).length;
                const total = (todayDay.tasks || []).length;
                setPlanProgress(total > 0 ? Math.round((completed / total) * 100) : 0);
              }
            }
          }

          if (results[1].status === 'fulfilled' && results[1].value.data.analytics) {
            const a = results[1].value.data.analytics;
            setQuizStats(prev => ({
              ...prev,
              averageScore: a.averageScore || prev.averageScore || 0,
              total: a.totalQuizzes || prev.total || 0,
              trend: a.improvement || prev.trend || 0,
              lastScore: a.scoreOverTime?.[0]?.score || prev.lastScore || 0
            }));
          }
        }
      } catch (err) {
        console.error("Dashboard page data load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [isPremium]);

  // Toggle Plan Task Completion
  const handleToggleTask = async (taskIndex) => {
    if (!activePlan) return;

    try {
      const todayStr = new Date().toLocaleDateString('en-CA');
      let dayIndex = activePlan.dailyPlan?.findIndex(d => d.date === todayStr);
      if (dayIndex === -1 || dayIndex == null) {
        dayIndex = activePlan.dailyPlan?.findIndex(d => !d.completed);
      }
      if (dayIndex === -1 || dayIndex == null) return;

      const res = await api.put(`/study-plan/${activePlan._id}/task`, {
        dayIndex,
        taskIndex
      });

      const updatedPlan = res.data.studyPlan;
      setActivePlan(updatedPlan);
      const todayDay = updatedPlan.dailyPlan?.[dayIndex];
      if (todayDay) {
        setTodayTasks(todayDay.tasks || []);
        const completed = (todayDay.tasks || []).filter(t => t.completed).length;
        const total = (todayDay.tasks || []).length;
        setPlanProgress(total > 0 ? Math.round((completed / total) * 100) : 0);
      }
    } catch (err) {
      console.error("Error toggling task:", err);
    }
  };

  // Chart Data Processing (Sử dụng local date format en-CA tránh lệch múi giờ)
  const getChartData = () => {
    const dataPoints = [];
    const now = new Date();

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
      const dayLabel = d.toLocaleDateString('vi-VN', { weekday: 'short' });
      const dayShort = dayLabel.replace('Thứ ', 'T').replace('Th ', 'T');

      const item = heatmapData.find(h => h.date === dateStr);
      const minutes = item ? item.totalMinutes : 0;

      dataPoints.push({
        date: dateStr,
        label: dayShort,
        minutes
      });
    }

    return dataPoints;
  };

  const chartData = getChartData();
  const maxMinutes = Math.max(...chartData.map(d => d.minutes), 60);

  // Heatmap Mini 30 days data
  const getMiniHeatmapData = () => {
    const cells = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA');

      const item = heatmapData.find(h => h.date === dateStr);
      const level = item ? item.level : 0;
      const mins = item ? item.totalMinutes : 0;

      cells.push({ date: dateStr, level, minutes: mins });
    }
    return cells;
  };

  const miniHeatmap = getMiniHeatmapData();

  // Circular progress stroke calculation
  const strokeDashoffset = 339.29 - (339.29 * (quizStats.averageScore || 0)) / 100;

  // Recent item to resume
  const mostRecentDoc = recentDocs[0];

  if (loading) {
    return (
      <div className="dashboard-loading-view">
        <div className="offline-pulse-dot" style={{ width: 36, height: 36, background: 'var(--accent)' }} />
        <p>Đang chuẩn bị không gian học tập của bạn...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-bento-container fade-in">
      
      {/* 1. HERO QUICK-RESUME BENTO CARD */}
      <section className="bento-hero-card">
        <div className="bento-hero-glow"></div>
        <div className="bento-hero-content">
          <div className="bento-hero-info">
            <div className="bento-hero-tags">
              {mostRecentDoc ? (
                <span className="bento-tag-active">
                  <span className="pulse-dot"></span>
                  Tiếp tục học dở gần nhất
                </span>
              ) : (
                <span className="bento-tag-active" style={{ color: 'var(--accent)', background: 'var(--accent-light)', borderColor: 'var(--accent)' }}>
                  ✨ Bắt đầu học tập
                </span>
              )}
              <div className="bento-tag-streak">
                <HiOutlineFire className="text-amber-500 animate-pulse" />
                <span>{streakInfo.currentStreak} ngày liên tiếp</span>
              </div>
              {isPremium ? (
                <span className="badge badge-warning bento-tag-pro">
                  <PiCrownBold /> Premium
                </span>
              ) : (
                <span className="badge badge-secondary cursor-pointer" onClick={() => navigate('/pricing')}>
                  Free Plan • Nâng cấp PRO
                </span>
              )}
            </div>

            <h1 className="bento-hero-title">
              {mostRecentDoc ? mostRecentDoc.title : 'Bắt đầu bài học đầu tiên của bạn'}
            </h1>

            <p className="bento-hero-desc">
              {mostRecentDoc 
                ? `Tài liệu gồm ${mostRecentDoc.pageCount || 1} trang. Đã sẵn sàng để tóm tắt, tạo thẻ flashcard và trắc nghiệm.`
                : 'Tải lên tài liệu PDF hoặc Word đầu tiên để StudyAI tự động tóm tắt, tạo thẻ ghi nhớ và bài tập trắc nghiệm.'}
            </p>

            {mostRecentDoc && (
              <div className="bento-hero-progress-wrap">
                <div className="progress-labels">
                  <span>Trạng thái tài liệu</span>
                  <span className="progress-val">
                    {mostRecentDoc.status === 'ready' ? 'Sẵn sàng 100%' : 'Đang xử lý...'}
                  </span>
                </div>
                <div className="progress-track">
                  <div className="progress-bar-fill" style={{ width: mostRecentDoc.status === 'ready' ? '100%' : '50%' }}></div>
                </div>
              </div>
            )}
          </div>

          <div className="bento-hero-actions">
            <button
              className="btn btn-primary btn-hero-resume"
              onClick={() => {
                if (mostRecentDoc) navigate(`/documents/${mostRecentDoc._id}`);
                else navigate('/documents');
              }}
            >
              <span>{mostRecentDoc ? 'Tiếp tục học ngay' : 'Tải tài liệu ngay'}</span>
              <HiOutlineArrowRight size={16} />
            </button>
            <button
              className="btn btn-secondary btn-hero-ask"
              onClick={openCommandPalette}
            >
              <HiOutlineBolt className="text-indigo-400" />
              <span>Hỏi nhanh AI</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. AI STUDIO QUICK TOOLS ROW */}
      <section className="bento-ai-tools-grid">
        <div 
          className="bento-tool-card" 
          onClick={() => navigate('/chat')}
        >
          <div className="tool-icon-box bg-blue-500-10 text-blue-500">
            <HiOutlineChatBubbleLeftRight size={22} />
          </div>
          <div className="tool-info">
            <h3 className="tool-title">Hỏi đáp tài liệu</h3>
            <p className="tool-desc">Trò chuyện chuyên sâu với PDF</p>
          </div>
        </div>

        <div 
          className="bento-tool-card" 
          onClick={() => navigate(isPremium ? '/ai-tools' : '/pricing')}
        >
          <div className="tool-icon-box bg-purple-500-10 text-purple-500">
            <HiOutlineSparkles size={22} />
          </div>
          <div className="tool-info">
            <h3 className="tool-title">Tóm tắt siêu tốc</h3>
            <p className="tool-desc">Rút gọn ý chính trong vài giây</p>
          </div>
        </div>

        <div 
          className="bento-tool-card" 
          onClick={() => navigate('/quiz')}
        >
          <div className="tool-icon-box bg-emerald-500-10 text-emerald-500">
            <HiOutlineClipboardDocumentCheck size={22} />
          </div>
          <div className="tool-info">
            <h3 className="tool-title">Đố vui kiến thức</h3>
            <p className="tool-desc">Tạo quiz trắc nghiệm ôn tập</p>
          </div>
        </div>

        <div 
          className="bento-tool-card" 
          onClick={() => navigate('/flashcards')}
        >
          <div className="tool-icon-box bg-amber-500-10 text-amber-500">
            <HiOutlineRectangleStack size={22} />
          </div>
          <div className="tool-info">
            <h3 className="tool-title">Flashcard thông minh</h3>
            <p className="tool-desc">Lặp lại ngắt quãng Spaced Repetition</p>
          </div>
        </div>
      </section>

      {/* 3. BENTO 3-COLUMN CORE: TASKS + ACTIVITY + QUIZ STATS */}
      <section className="bento-core-grid">

        {/* Col 1: Kế hoạch học hôm nay */}
        <div className="bento-card bento-card-tasks">
          <div className="bento-card-header">
            <div className="bento-header-left">
              <span className="bento-header-icon text-indigo-500">
                <HiOutlineCalendarDays size={20} />
              </span>
              <h2 className="bento-card-title">Kế hoạch hôm nay</h2>
            </div>
            {todayTasks.length > 0 && (
              <span className="bento-task-badge">
                {`${todayTasks.filter(t => t.completed).length}/${todayTasks.length} hoàn thành`}
              </span>
            )}
          </div>

          <div className="bento-task-list">
            {todayTasks.length > 0 ? (
              todayTasks.map((task, idx) => (
                <div
                  key={task._id || idx}
                  className={`bento-task-item ${task.completed ? 'completed' : ''}`}
                  onClick={() => handleToggleTask(idx)}
                >
                  <div className={`bento-checkbox ${task.completed ? 'checked' : ''}`}>
                    {task.completed && <HiOutlineCheck size={13} />}
                  </div>
                  <div className="bento-task-body">
                    <span className="task-desc">{task.description}</span>
                    <span className="task-meta">{task.duration || 20} phút</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p style={{ margin: 0, fontSize: 13.5 }}>Không có mục tiêu nào được lên lịch hôm nay 🎉</p>
                <p style={{ margin: '4px 0 16px 0', fontSize: 12, color: 'var(--text-tertiary)' }}>
                  {isPremium 
                    ? 'Hãy tạo kế hoạch học tập mới với AI để duy trì mục tiêu.' 
                    : 'Nâng cấp Premium để lập lộ trình học tập tự động.'}
                </p>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate(isPremium ? '/study-plan' : '/pricing')}
                >
                  {isPremium ? 'Lên kế hoạch ngay' : 'Khám phá Kế hoạch học AI'}
                </button>
              </div>
            )}
          </div>

          {todayTasks.length > 0 && (
            <div className="bento-card-footer">
              <button
                className="btn-card-action"
                onClick={() => navigate('/study-plan')}
              >
                <span>Xem kế hoạch chi tiết →</span>
              </button>
            </div>
          )}
        </div>

        {/* Col 2: Biểu đồ thời lượng học */}
        <div className="bento-card bento-card-chart">
          <div className="bento-card-header">
            <div>
              <h2 className="bento-card-title">Thời lượng học tập</h2>
              <p className="bento-card-subtitle">Thống kê tương tác với AI</p>
            </div>
            <div className="bento-chart-toggle">
              <button
                className={`chart-tab ${daysCount === 7 ? 'active' : ''}`}
                onClick={() => setDaysCount(7)}
              >
                7 ngày
              </button>
              <button
                className={`chart-tab ${daysCount === 30 ? 'active' : ''}`}
                onClick={() => setDaysCount(30)}
              >
                30 ngày
              </button>
            </div>
          </div>

          {/* Interactive Bars Container */}
          <div className="bento-bars-viewport">
            {chartData.map((d, idx) => {
              const heightPct = d.minutes > 0 ? Math.max(Math.round((d.minutes / maxMinutes) * 100), 8) : 4;
              return (
                <div 
                  key={idx} 
                  className="bento-bar-col group"
                  onMouseEnter={() => setHoveredBar({ label: d.label, date: d.date, minutes: d.minutes })}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  <div className="bento-bar-val">{d.minutes}m</div>
                  <div className="bento-bar-track">
                    <div 
                      className="bento-bar-fill" 
                      style={{ 
                        height: `${heightPct}%`,
                        opacity: d.minutes > 0 ? 1 : 0.25 
                      }}
                    />
                  </div>
                  <span className="bento-bar-label">{d.label}</span>
                </div>
              );
            })}
          </div>

          {hoveredBar && (
            <div className="bento-chart-tooltip-bubble">
              <span>{hoveredBar.date}:</span>
              <strong>{hoveredBar.minutes} phút học</strong>
            </div>
          )}

          <div className="bento-chart-summary">
            <span>Tổng thời lượng: <strong className="text-white">{streakInfo.totalMinutes || 0} phút</strong></span>
            <span className="text-emerald-400 flex items-center gap-1">
              <HiOutlineArrowUpRight size={14} /> {streakInfo.currentStreak} ngày streak
            </span>
          </div>
        </div>

        {/* Col 3: Hiệu suất trắc nghiệm & Hoạt động 30 ngày */}
        <div className="bento-card bento-card-quiz">
          <div className="bento-card-header">
            <h2 className="bento-card-title">Hiệu suất Quiz</h2>
            <span className="bento-quiz-badge">{quizStats.total} bài thi</span>
          </div>

          {/* Circular Score Gauge */}
          <div className="bento-gauge-wrapper">
            <div className="gauge-circle-box">
              <svg viewBox="0 0 120 120">
                <circle className="gauge-bg" cx="60" cy="60" r="54" />
                <circle
                  className="gauge-fill"
                  cx="60"
                  cy="60"
                  r="54"
                  strokeDasharray="339.29"
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div className="gauge-inner-text">
                <span className="gauge-score">{quizStats.averageScore}<span>%</span></span>
                <span className="gauge-lbl">Điểm TB</span>
              </div>
            </div>

            <div className="bento-quiz-metrics">
              <div className="metric-row">
                <span className="lbl">Gần nhất</span>
                <span className="val text-emerald-400 font-semibold">{quizStats.lastScore}%</span>
              </div>
              <div className="metric-row">
                <span className="lbl">Số bài thi</span>
                <span className="val text-indigo-400 font-semibold">{quizStats.total}</span>
              </div>
            </div>
          </div>

          {/* Mini 30-Day Heatmap Strip */}
          <div className="bento-mini-heatmap-box">
            <div className="heatmap-subhead">
              <span>Chuỗi 30 ngày học</span>
              <span className="text-amber-400 font-medium">🔥 {streakInfo.currentStreak} ngày</span>
            </div>
            <div className="heatmap-strip">
              {miniHeatmap.map((item, idx) => (
                <div
                  key={idx}
                  className={`heatmap-box level-${item.level}`}
                  title={`${item.date}: ${item.minutes} phút`}
                />
              ))}
            </div>
          </div>

          <div className="bento-card-footer">
            <button className="btn btn-secondary btn-sm w-full" onClick={() => navigate('/quiz')}>
              Xem chi tiết kết quả Quiz →
            </button>
          </div>
        </div>

      </section>

      {/* 4. TÀI LIỆU GẦN ĐÂY BENTO SECTION */}
      <section className="bento-docs-section">
        <div className="bento-docs-header">
          <div>
            <h2 className="section-title">Tài liệu học tập gần đây</h2>
            <p className="section-subtitle">Truy cập tức thì và tương tác với tài liệu bạn vừa tải lên</p>
          </div>
          <div className="bento-docs-actions">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/documents')}
            >
              Xem tất cả ({stats.documents})
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/documents')}
            >
              <HiOutlineCloudArrowUp size={16} />
              <span>Upload mới</span>
            </button>
          </div>
        </div>

        {recentDocs.length === 0 ? (
          <div className="bento-docs-empty">
            <div className="empty-icon">📄</div>
            <h3>Chưa có tài liệu nào</h3>
            <p>Tải lên tệp PDF hoặc Word đầu tiên để StudyAI hỗ trợ tóm tắt và làm bài tập trắc nghiệm.</p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/documents')}
            >
              Tải tài liệu ngay
            </button>
          </div>
        ) : (
          <div className="bento-docs-grid">
            {recentDocs.map((doc) => (
              <div
                key={doc._id}
                className="doc-card-modern"
                onClick={() => navigate(`/documents/${doc._id}`)}
              >
                <div className="doc-card-top">
                  <div className="doc-icon-badge">
                    {doc.fileType === 'pdf' || doc.title?.endsWith('.pdf') ? '📕' : '📘'}
                  </div>
                  <span className={`badge ${doc.status === 'ready' ? 'badge-success' : doc.status === 'processing' ? 'badge-warning' : 'badge-danger'}`}>
                    {doc.status === 'ready' ? 'Sẵn sàng' : doc.status === 'processing' ? 'Đang xử lý' : 'Lỗi'}
                  </span>
                </div>

                <h3 className="doc-title" title={doc.title}>
                  {doc.title}
                </h3>

                <div className="doc-meta-row">
                  <span>{doc.pageCount || 1} trang</span>
                  <span>•</span>
                  <span>{new Date(doc.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>

                <div className="doc-card-bottom">
                  <span className="doc-action-hint">Nhấp để mở học ➔</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
