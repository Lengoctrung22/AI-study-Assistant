import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  HiOutlineDocumentText, 
  HiOutlineRectangleStack, 
  HiOutlineClipboardDocumentCheck, 
  HiOutlineChatBubbleLeftRight,
  HiOutlineSparkles,
  HiOutlineCalendarDays,
  HiOutlineCheck,
  HiOutlineArrowRight,
  HiOutlineFire,
  HiOutlineCloudArrowUp,
  HiOutlineChevronRight,
  HiOutlineArrowUpRight,
  HiOutlineArrowDownRight
} from 'react-icons/hi2';
import { PiCrownBold } from 'react-icons/pi';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isPremium = user?.plan === 'premium';

  // State for stats and data
  const [stats, setStats] = useState({ documents: 0, flashcards: 0, quizzes: 0, chats: 0 });
  const [animatedStats, setAnimatedStats] = useState({ documents: 0, flashcards: 0, quizzes: 0, chats: 0 });
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Premium data states
  const [activePlan, setActivePlan] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [planProgress, setPlanProgress] = useState(0);
  const [streakInfo, setStreakInfo] = useState({ currentStreak: 5, longestStreak: 12 });
  const [heatmapData, setHeatmapData] = useState([]);
  const [quizStats, setQuizStats] = useState({ averageScore: 78, total: 12, trend: 5, lastScore: 85 });

  // UI state
  const [daysCount, setDaysCount] = useState(7); // 7 or 30 days
  const [hoveredBar, setHoveredBar] = useState(null); // tooltip data

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch core data (available to all tiers)
        const [docsRes, fcRes, quizRes, chatRes] = await Promise.all([
          api.get('/documents'),
          api.get('/flashcards'),
          api.get('/quiz'),
          api.get('/chat/sessions').catch(() => ({ data: { sessions: [] } }))
        ]);

        const rawDocs = docsRes.data.documents || [];
        const rawFc = fcRes.data.flashcardSets || [];
        const rawQuizzes = quizRes.data.quizzes || [];
        const rawChats = chatRes.data.sessions || [];

        const docsCount = rawDocs.length;
        const fcCount = rawFc.length;
        const quizCount = rawQuizzes.length;
        const chatCount = rawChats.length;

        setStats({
          documents: docsCount,
          flashcards: fcCount,
          quizzes: quizCount,
          chats: chatCount,
        });

        // Set recent documents
        setRecentDocs(rawDocs.slice(0, 5));

        // Process Quiz stats for non-premium (or premium fallback)
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

          // Simple trend calculation
          let trend = 0;
          if (completedQuizzes.length >= 2) {
            const last3 = completedQuizzes.slice(0, 3);
            const last3Avg = last3.reduce((sum, q) => sum + ((q.result?.score || 0) / (q.result?.total || 1)) * 100, 0) / last3.length;
            trend = Math.round(last3Avg - avg);
          } else {
            trend = 5; // Default positive trend
          }

          setQuizStats({
            averageScore: avg,
            total: completedQuizzes.length,
            trend: trend,
            lastScore: lastScore
          });
        } else {
          // If no quizzes completed, use zero-stats
          setQuizStats({
            averageScore: 0,
            total: 0,
            trend: 0,
            lastScore: 0
          });
        }

        // Fetch Streak Info and Heatmap Data (available to ALL tiers)
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
          console.warn("Failed to fetch study activity stats:", statsErr.message);
        }

        // Fetch Premium Data
        if (isPremium) {
          const results = await Promise.allSettled([
            api.get('/study-plan'),
            api.get('/quiz/analytics')
          ]);

          // Handle Study Plan
          if (results[0].status === 'fulfilled') {
            const plans = results[0].value.data.studyPlans || [];
            const active = plans.find(p => p.status === 'active');
            if (active) {
              setActivePlan(active);
              // Get today's tasks
              const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local format
              let todayDay = active.dailyPlan.find(d => d.date === todayStr);
              
              // Fallback to first incomplete day if today is not in plan range
              if (!todayDay) {
                todayDay = active.dailyPlan.find(d => !d.completed);
              }

              if (todayDay) {
                setTodayTasks(todayDay.tasks || []);
                const completed = (todayDay.tasks || []).filter(t => t.completed).length;
                const total = (todayDay.tasks || []).length;
                setPlanProgress(total > 0 ? Math.round((completed / total) * 100) : 0);
              }
            }
          }

          // Handle Quiz Analytics
          if (results[1].status === 'fulfilled' && results[1].value.data.analytics) {
            const a = results[1].value.data.analytics;
            setQuizStats({
              averageScore: a.averageScore || 0,
              total: a.totalQuizzes || 0,
              trend: a.improvement || 0,
              lastScore: a.scoreOverTime?.[0]?.score || 0
            });
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

  // Count-up animation for stats
  useEffect(() => {
    if (loading) return;
    
    const duration = 1000; // 1s
    const steps = 30;
    const stepTime = duration / steps;
    
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      setAnimatedStats({
        documents: Math.min(Math.round((stats.documents * currentStep) / steps), stats.documents),
        flashcards: Math.min(Math.round((stats.flashcards * currentStep) / steps), stats.flashcards),
        quizzes: Math.min(Math.round((stats.quizzes * currentStep) / steps), stats.quizzes),
        chats: Math.min(Math.round((stats.chats * currentStep) / steps), stats.chats),
      });

      if (currentStep >= steps) clearInterval(interval);
    }, stepTime);

    return () => clearInterval(interval);
  }, [loading, stats]);

  // Greeting Logic
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Chào buổi sáng';
    if (hr < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  // Toggle Plan Task Completion
  const handleToggleTask = async (taskIndex) => {
    if (!activePlan) return;
    try {
      // Find today's plan day index
      const todayStr = new Date().toLocaleDateString('en-CA');
      let dayIndex = activePlan.dailyPlan.findIndex(d => d.date === todayStr);
      if (dayIndex === -1) {
        dayIndex = activePlan.dailyPlan.findIndex(d => !d.completed);
      }

      if (dayIndex === -1) return;

      const res = await api.put(`/study-plan/${activePlan._id}/task`, {
        dayIndex,
        taskIndex
      });

      // Update local state
      const updatedPlan = res.data.studyPlan;
      setActivePlan(updatedPlan);
      const todayDay = updatedPlan.dailyPlan[dayIndex];
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

  // Chart Data Processing
  const getChartData = () => {
    const dataPoints = [];
    const now = new Date();

    // Setup dates
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('vi-VN', { weekday: 'short' }); // e.g., "Th 2"
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
  const maxMinutes = Math.max(...chartData.map(d => d.minutes), 60); // minimum scale 60 mins

  // Heatmap Mini 30 days data
  const getMiniHeatmapData = () => {
    const cells = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const item = heatmapData.find(h => h.date === dateStr);
      const level = item ? item.level : 0;
      const mins = item ? item.totalMinutes : 0;

      cells.push({ date: dateStr, level, minutes: mins });
    }
    return cells;
  };

  const miniHeatmap = getMiniHeatmapData();

  // Circular progress stroke calculation
  const strokeDashoffset = 339.29 - (339.29 * quizStats.averageScore) / 100;

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="offline-pulse-dot" style={{ width: 32, height: 32, background: 'var(--accent)' }} />
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Đang tải dữ liệu học tập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container fade-in" style={{ paddingBottom: 40 }}>
      
      {/* 1. HEADER CHÀO MỪNG */}
      <div className="dashboard-welcome stagger-in stagger-in-1">
        <div className="dashboard-welcome-left">
          <div className="dashboard-welcome-title-row">
            <h1 className="dashboard-welcome-title">
              {getGreeting()}, {user?.name || 'Bạn'}! 👋
            </h1>
            
            <div className="dashboard-badge-streak" title="Streak học tập liên tiếp">
              <span className="streak-pulse-fire"><HiOutlineFire /></span>
              <span>{streakInfo.currentStreak} ngày</span>
            </div>

            {isPremium ? (
              <div className="dashboard-badge-premium" title="Bạn là thành viên cao cấp">
                <PiCrownBold />
                <span>Premium</span>
              </div>
            ) : (
              <div className="dashboard-badge-free" onClick={() => navigate('/pricing')} style={{ cursor: 'pointer' }} title="Nâng cấp Premium ngay">
                <span>Free Plan</span>
                <span style={{ fontSize: 10, color: 'var(--accent)' }}>Nâng cấp 👑</span>
              </div>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 14, fontWeight: 500 }}>
            Bạn đã học liên tục {streakInfo.currentStreak} ngày. Tiếp tục phát huy!
          </p>
        </div>
        <div style={{ color: 'var(--text-tertiary)', fontSize: 13, fontWeight: 600 }}>
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* 2. STAT CARDS ROW */}
      <div className="dashboard-stats-grid stagger-in stagger-in-2">
        
        {/* Card 1: Tài liệu */}
        <div className="dashboard-glass dashboard-stat-card" onClick={() => navigate('/documents')} style={{ cursor: 'pointer' }}>
          <div className="dashboard-stat-icon-box" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <HiOutlineDocumentText />
          </div>
          <div>
            <div className="dashboard-stat-number">{animatedStats.documents}</div>
            <div className="dashboard-stat-label">Tài liệu</div>
          </div>
        </div>

        {/* Card 2: Flashcards */}
        <div className="dashboard-glass dashboard-stat-card" onClick={() => navigate('/flashcards')} style={{ cursor: 'pointer' }}>
          <div className="dashboard-stat-icon-box" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
            <HiOutlineRectangleStack />
          </div>
          <div>
            <div className="dashboard-stat-number">{animatedStats.flashcards}</div>
            <div className="dashboard-stat-label">Bộ Flashcard</div>
          </div>
        </div>

        {/* Card 3: Quiz */}
        <div className="dashboard-glass dashboard-stat-card" onClick={() => navigate('/quiz')} style={{ cursor: 'pointer' }}>
          <div className="dashboard-stat-icon-box" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <HiOutlineClipboardDocumentCheck />
          </div>
          <div>
            <div className="dashboard-stat-number">{animatedStats.quizzes}</div>
            <div className="dashboard-stat-label">Bài Quiz đã làm</div>
          </div>
        </div>

        {/* Card 4: Chat AI */}
        <div className="dashboard-glass dashboard-stat-card" onClick={() => navigate('/chat')} style={{ cursor: 'pointer' }}>
          <div className="dashboard-stat-icon-box" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <HiOutlineChatBubbleLeftRight />
          </div>
          <div>
            <div className="dashboard-stat-number">{animatedStats.chats}</div>
            <div className="dashboard-stat-label">Phiên Chat AI</div>
          </div>
        </div>

      </div>

      {/* 3. BIỂU ĐỒ HOẠT ĐỘNG HỌC TẬP */}
      <div className="dashboard-glass dashboard-activity-chart stagger-in stagger-in-3">
        <div className="dashboard-chart-header">
          <div className="dashboard-chart-header-left">
            <h3>Thời gian học spending (phút)</h3>
            <p>Thống kê thời lượng bạn tương tác học tập với AI</p>
          </div>
          <div className="dashboard-chart-toggle">
            <button 
              className={`dashboard-chart-toggle-btn ${daysCount === 7 ? 'active' : ''}`}
              onClick={() => setDaysCount(7)}
            >
              7 ngày
            </button>
            <button 
              className={`dashboard-chart-toggle-btn ${daysCount === 30 ? 'active' : ''}`}
              onClick={() => setDaysCount(30)}
            >
              30 ngày
            </button>
          </div>
        </div>

        <div className="dashboard-chart-svg-wrap">
          {chartData.map((data, idx) => {
            const pct = (data.minutes / maxMinutes) * 100;
            return (
              <div key={idx} className="dashboard-chart-bar-column">
                
                {/* Bar fill */}
                <div 
                  className="dashboard-chart-bar-fill" 
                  style={{ 
                    height: `${Math.max(pct, 4)}%`, 
                    background: data.minutes > 0 ? 'linear-gradient(180deg, #4338ca 0%, #6d28d9 100%)' : 'rgba(99, 102, 241, 0.15)' 
                  }}
                />

                {/* Hover trigger zone */}
                <div 
                  className="dashboard-chart-bar-hover-zone"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const containerRect = e.currentTarget.parentElement.parentElement.getBoundingClientRect();
                    setHoveredBar({
                      index: idx,
                      x: rect.left - containerRect.left + (rect.width / 2),
                      date: new Date(data.date).toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' }),
                      minutes: data.minutes
                    });
                  }}
                  onMouseLeave={() => setHoveredBar(null)}
                />

                {/* Day Label (Only show all on 7d, show every 5th on 30d) */}
                {(daysCount === 7 || idx % 5 === 0) && (
                  <div className={`dashboard-chart-bar-label ${data.minutes > 0 ? 'active' : ''}`}>
                    {data.label}
                  </div>
                )}
              </div>
            );
          })}

          {/* Tooltip */}
          {hoveredBar && (
            <div 
              className="dashboard-chart-tooltip" 
              style={{ left: hoveredBar.x }}
            >
              <span style={{ fontSize: 10, color: '#9ca3af' }}>Ngày {hoveredBar.date}</span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{hoveredBar.minutes} phút</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. KHU VỰC 2 CỘT */}
      <div className="dashboard-grid-2col stagger-in stagger-in-4">
        
        {/* CỘT TRÁI (60%) */}
        <div className="dashboard-col-left">
          
          {/* Section: Kế hoạch học hôm nay */}
          <div className="dashboard-glass">
            <div className="dashboard-plan-header">
              <div className="dashboard-plan-title">
                <HiOutlineCalendarDays style={{ color: 'var(--accent)' }} />
                <h3>Kế hoạch học hôm nay</h3>
              </div>
              {isPremium && activePlan && (
                <div className="dashboard-plan-progress-percent">
                  {planProgress}% hoàn thành
                </div>
              )}
            </div>

            {/* Premium user plan display */}
            {isPremium ? (
              activePlan ? (
                <div>
                  <div className="progress-bar" style={{ height: 6, borderRadius: 3, background: 'var(--bg-tertiary)' }}>
                    <div className="progress-fill" style={{ width: `${planProgress}%`, background: 'var(--accent)' }} />
                  </div>

                  {todayTasks.length === 0 ? (
                    <div style={{ padding: '24px 0', textAlignment: 'center', color: 'var(--text-secondary)' }}>
                      <p style={{ margin: 0, fontSize: 14 }}>Không có mục tiêu nào được lên lịch cho hôm nay 🎉</p>
                      <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => navigate('/study-plan')}>
                        Tạo kế hoạch học tập mới
                      </button>
                    </div>
                  ) : (
                    <div className="dashboard-plan-list">
                      {todayTasks.map((task, idx) => (
                        <div 
                          key={task._id || idx} 
                          className="dashboard-plan-item"
                          onClick={() => handleToggleTask(idx)}
                        >
                          <div className={`dashboard-plan-checkbox ${task.completed ? 'checked' : ''}`}>
                            {task.completed && <HiOutlineCheck size={14} />}
                          </div>
                          <div className="dashboard-plan-item-content">
                            <div className={`dashboard-plan-desc ${task.completed ? 'completed' : ''}`}>
                              {task.description}
                            </div>
                          </div>
                          <div className="dashboard-plan-item-duration">
                            {task.duration} phút
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: 20, textAlign: 'right' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate('/study-plan')} style={{ gap: 4, display: 'inline-flex', alignItems: 'center' }}>
                      Xem kế hoạch đầy đủ <HiOutlineArrowRight />
                    </button>
                  </div>
                </div>
              ) : (
                /* Premium but no active plan yet */
                <div className="dashboard-premium-ad-card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)', border: '1px dashed rgba(168, 85, 247, 0.3)' }}>
                  <div style={{ fontSize: 32 }}>📅</div>
                  <h4>Chưa có kế hoạch học tập nào được kích hoạt</h4>
                  <p>
                    Hãy tạo một lộ trình học tập tối ưu hóa bởi AI bằng cách lựa chọn tài liệu của bạn.
                  </p>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate('/study-plan')} style={{ marginTop: 8, gap: 6, display: 'inline-flex', alignItems: 'center' }}>
                    Tạo kế hoạch học tập <HiOutlineSparkles />
                  </button>
                </div>
              )
            ) : (
              /* Free Plan Banner */
              <div className="dashboard-premium-ad-card">
                <div style={{ fontSize: 32 }}>📋</div>
                <h4>Kế hoạch học tập tối ưu hóa bởi AI</h4>
                <p>
                  Tự động phân bổ tài liệu học tập thành lộ trình chi tiết từng ngày, giúp duy trì mục tiêu của bạn.
                </p>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/pricing')} style={{ marginTop: 8, gap: 6, display: 'inline-flex', alignItems: 'center' }}>
                  Nâng cấp Premium <PiCrownBold />
                </button>
              </div>
            )}
          </div>

          {/* Section: Tài liệu gần đây */}
          <div className="dashboard-glass">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Tài liệu gần đây</h3>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/documents')}>Xem tất cả</button>
                <button className="btn btn-primary btn-sm" style={{ gap: 4, display: 'inline-flex', alignItems: 'center' }} onClick={() => navigate('/documents')}>
                  <HiOutlineCloudArrowUp /> Upload mới
                </button>
              </div>
            </div>

            {recentDocs.length === 0 ? (
              <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p style={{ margin: 0, fontSize: 14 }}>Bạn chưa tải lên tài liệu nào.</p>
                <p style={{ margin: '4px 0 16px 0', fontSize: 12 }}>Tải file PDF hoặc Word ngay để bắt đầu tóm tắt và làm trắc nghiệm.</p>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/documents')}>Tải tài liệu lên</button>
              </div>
            ) : (
              <div className="dashboard-table-wrap">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Tài liệu</th>
                      <th>Số trang</th>
                      <th>Tải lên</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDocs.map((doc) => (
                      <tr key={doc._id}>
                        <td>
                          <div className="dashboard-doc-name-cell" onClick={() => navigate(`/documents/${doc._id}`)}>
                            <span className="dashboard-doc-icon">📄</span>
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 200 }} title={doc.title}>
                              {doc.title}
                            </span>
                          </div>
                        </td>
                        <td>{doc.pageCount || 0} trang</td>
                        <td>{new Date(doc.createdAt).toLocaleDateString('vi-VN')}</td>
                        <td>
                          <span className={`badge ${doc.status === 'ready' ? 'badge-success' : doc.status === 'processing' ? 'badge-warning' : 'badge-danger'}`}>
                            {doc.status === 'ready' ? 'Sẵn sàng ✅' : doc.status === 'processing' ? 'Đang xử lý ⏳' : 'Lỗi ❌'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* CỘT PHẢI (40%) */}
        <div className="dashboard-col-right">

          {/* Section: Hiệu suất Quiz */}
          <div className="dashboard-glass">
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px 0' }}>Hiệu suất trắc nghiệm</h3>
            
            <div className="dashboard-quiz-wrapper">
              
              {/* Circular Chart */}
              <div className="dashboard-quiz-circular-box">
                <svg width="100%" height="100%" viewBox="0 0 120 120">
                  <circle className="dashboard-quiz-circular-bg" cx="60" cy="60" r="54" />
                  <circle 
                    className="dashboard-quiz-circular-fill" 
                    cx="60" 
                    cy="60" 
                    r="54" 
                    strokeDasharray="339.29"
                    strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <div className="dashboard-quiz-score-text">
                  <span className="dashboard-quiz-score-val">{quizStats.averageScore}%</span>
                  <span className="dashboard-quiz-score-lbl">Điểm TB</span>
                </div>
              </div>

              {/* Substats */}
              <div className="dashboard-quiz-stats-grid">
                <div className="dashboard-quiz-stat-item">
                  <span className="dashboard-quiz-stat-lbl">Đã làm</span>
                  <span className="dashboard-quiz-stat-val">{quizStats.total}</span>
                </div>
                <div className="dashboard-quiz-stat-item">
                  <span className="dashboard-quiz-stat-lbl">Xu hướng</span>
                  <span className="dashboard-quiz-stat-val" style={{ color: quizStats.trend >= 0 ? '#10b981' : '#ef4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                    {quizStats.trend >= 0 ? <HiOutlineArrowUpRight /> : <HiOutlineArrowDownRight />}
                    {Math.abs(quizStats.trend)}%
                  </span>
                </div>
                <div className="dashboard-quiz-stat-item">
                  <span className="dashboard-quiz-stat-lbl">Gần nhất</span>
                  <span className="dashboard-quiz-stat-val">{quizStats.lastScore}%</span>
                </div>
              </div>

            </div>

            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={() => navigate('/quiz')}>
                Xem tất cả bài trắc nghiệm →
              </button>
            </div>
          </div>

          {/* Section: Hành động nhanh */}
          <div className="dashboard-glass">
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px 0' }}>Hành động nhanh</h3>
            
            <div className="dashboard-quick-grid">
              
              <div className="dashboard-quick-card" onClick={() => navigate('/documents')}>
                <span className="dashboard-quick-icon">📤</span>
                <span className="dashboard-quick-lbl">Tải tài liệu</span>
              </div>

              <div className="dashboard-quick-card" onClick={() => navigate('/chat')}>
                <span className="dashboard-quick-icon">🤖</span>
                <span className="dashboard-quick-lbl">Chat với AI</span>
              </div>

              <div className="dashboard-quick-card" onClick={() => navigate('/flashcards')}>
                <span className="dashboard-quick-icon">🃏</span>
                <span className="dashboard-quick-lbl">Ôn Flashcard</span>
              </div>

              <div className="dashboard-quick-card" onClick={() => navigate('/quiz')}>
                <span className="dashboard-quick-icon">📝</span>
                <span className="dashboard-quick-lbl">Làm Quiz</span>
              </div>

            </div>
          </div>

          {/* Section: Chuỗi học tập (Study Streak Heatmap) */}
          <div className="dashboard-glass">
            <div className="dashboard-heatmap-header">
              <h3 className="dashboard-heatmap-title">Hoạt động 30 ngày qua</h3>
              <div className="dashboard-badge-streak" style={{ padding: '2px 8px', fontSize: 11 }}>
                🔥 {streakInfo.currentStreak} ngày liên tục!
              </div>
            </div>

            <div className="dashboard-heatmap-grid-30">
              {miniHeatmap.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`dashboard-heatmap-cell-30 level-${item.level}`}
                  title={`${new Date(item.date).toLocaleDateString('vi-VN')}: ${item.minutes} phút`}
                />
              ))}
            </div>

            <div className="dashboard-heatmap-footer">
              <span>Kỷ lục streak: {streakInfo.longestStreak} ngày</span>
              <span style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                Ít {[0,1,2,3,4].map(l => (
                  <span key={l} className={`dashboard-heatmap-cell-30 level-${l}`} style={{ width: 8, height: 8 }} />
                ))} Nhiều
              </span>
            </div>

            {!isPremium && (
              <div style={{ 
                marginTop: 12, 
                padding: '8px 12px', 
                background: 'rgba(245, 158, 11, 0.05)', 
                border: '1px dashed rgba(245, 158, 11, 0.25)', 
                borderRadius: 8,
                fontSize: 11,
                color: 'var(--text-secondary)',
                textAlign: 'center'
              }}>
                Nâng cấp Premium để xem lịch sử hoạt động đầy đủ 💎
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
