import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';
import { Eye, Edit, Trash2, Gift, CreditCard, List } from 'lucide-react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import AdminNav from '../components/AdminNav';
import { useLocation, useNavigate } from 'react-router-dom';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'users', label: 'Users' },
  { key: 'opps', label: 'Opportunities' },
  { key: 'apps', label: 'Applications' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'subs', label: 'Subscriptions' },
];

const initialUser = { id: '', name: '', email: '', user_type: '' };
const initialOpp = { id: '', title: '', description: '', clinic_id: '', status: '', created_at: '' };
const initialPlan = { id: '', name: '', price: '', applications_limit: '', opportunities_limit: '', duration_days: '', description: '' };

const Admin = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryTab = new URLSearchParams(location.search).get('tab');
  const tab = queryTab || 'dashboard';
  const [users, setUsers] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editUser, setEditUser] = useState(initialUser);
  const [showOppModal, setShowOppModal] = useState(false);
  const [editOpp, setEditOpp] = useState(initialOpp);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editPlan, setEditPlan] = useState(initialPlan);
  const [modalMode, setModalMode] = useState('view'); // 'view' or 'edit' or 'create'
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignUserId, setAssignUserId] = useState(null);
  const [assignPlanId, setAssignPlanId] = useState('');
  const [showSubsModal, setShowSubsModal] = useState(false);
  const [subsUserId, setSubsUserId] = useState(null);
  const [userSubs, setUserSubs] = useState([]);
  const [subStats, setSubStats] = useState(null);
  const [payStats, setPayStats] = useState(null);
  const [statsError, setStatsError] = useState('');
  const [openMenu, setOpenMenu] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [oppSearch, setOppSearch] = useState('');
  const [oppPage, setOppPage] = useState(1);
  const [appSearch, setAppSearch] = useState('');
  const [appPage, setAppPage] = useState(1);
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewPage, setReviewPage] = useState(1);
  const [openActionMenu, setOpenActionMenu] = useState({});
  const actionMenuRef = useRef({});

  // Helper to close menu on outside click
  useEffect(() => {
    function handleClick(e) {
      if (Object.values(actionMenuRef.current).some(ref => ref && !ref.contains(e.target))) {
        setOpenActionMenu({});
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    fetchData();
    fetchStats();
    // eslint-disable-next-line
  }, [tab, refresh]);

  const handleTabChange = (newTab) => {
    navigate(`/admin?tab=${newTab}`);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 'dashboard') {
        // No specific data fetch for dashboard, just ensure all data is loaded
        // Users, Opportunities, Applications, Reviews, Profiles, Plans are fetched by their respective tabs
      } else if (tab === 'users') {
        const res = await axios.get('/api/admin/users');
        setUsers(res.data);
      } else if (tab === 'opps') {
        const res = await axios.get('/api/admin/opportunities');
        setOpportunities(res.data);
      } else if (tab === 'apps') {
        const res = await axios.get('/api/applications');
        setApplications(res.data);
      } else if (tab === 'reviews') {
        const clinics = await axios.get('/api/admin/users');
        let allReviews = [];
        for (let u of clinics.data.filter(u => u.user_type === 'clinic').slice(0, 10)) {
          const res = await axios.get(`/api/clinic/${u.id}/reviews`);
          allReviews = allReviews.concat(res.data.map(r => ({ ...r, clinic_id: u.id, clinic_name: u.name })));
        }
        setReviews(allReviews);
      } else if (tab === 'subs') {
        const res = await axios.get('/api/admin/subscription-plans');
        setPlans(res.data);
      }
    } catch (err) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsError('');
    try {
      const [subsRes, paysRes] = await Promise.all([
        axios.get('/api/admin/stats/subscriptions'),
        axios.get('/api/admin/stats/payments')
      ]);
      setSubStats(subsRes.data);
      setPayStats(paysRes.data);
    } catch {
      setStatsError('Failed to load analytics. Please check your server.');
    }
  };

  // CRUD actions
  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    await axios.delete(`/api/admin/users/${id}`);
    toast.success('User deleted');
    setRefresh(r => r + 1);
  };
  const updateUser = async () => {
    // For demo, only allow changing name and user_type
    try {
      await axios.put(`/api/admin/users/${editUser.id}`, { name: editUser.name, user_type: editUser.user_type });
      toast.success('User updated');
      setShowUserModal(false);
      setRefresh(r => r + 1);
    } catch {
      toast.error('Failed to update user');
    }
  };
  const deleteOpportunity = async (id) => {
    if (!window.confirm('Delete this opportunity?')) return;
    await axios.delete(`/api/admin/opportunities/${id}`);
    toast.success('Opportunity deleted');
    setRefresh(r => r + 1);
  };
  const updateOpportunity = async () => {
    try {
      await axios.put(`/api/opportunities/${editOpp.id}`, editOpp);
      toast.success('Opportunity updated');
      setShowOppModal(false);
      setRefresh(r => r + 1);
    } catch {
      toast.error('Failed to update opportunity');
    }
  };
  const deleteApplication = async (id) => {
    if (!window.confirm('Delete this application?')) return;
    await axios.delete(`/api/applications/${id}`);
    toast.success('Application deleted');
    setRefresh(r => r + 1);
  };
  const deleteReview = async (clinicId, reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    await axios.delete(`/api/clinic/${clinicId}/review/${reviewId}`);
    toast.success('Review deleted');
    setRefresh(r => r + 1);
  };

  // Modal helpers
  const openUserModal = (user, mode='view') => {
    setEditUser(user);
    setModalMode(mode);
    setShowUserModal(true);
  };
  const openOppModal = (opp, mode='view') => {
    setEditOpp(opp);
    setModalMode(mode);
    setShowOppModal(true);
  };

  // Plan CRUD actions
  const openPlanModal = (plan = initialPlan, mode = 'view') => {
    console.log('openPlanModal called with:', plan, mode);
    toast(`Opening plan modal: ${mode}`);
    setEditPlan(plan);
    setModalMode(mode);
    setShowPlanModal(true);
  };
  const deletePlan = async (id) => {
    if (!window.confirm('Delete this plan?')) return;
    await axios.delete(`/api/admin/subscription-plans/${id}`);
    toast.success('Plan deleted');
    setRefresh(r => r + 1);
  };
  const updatePlan = async () => {
    try {
      await axios.put(`/api/admin/subscription-plans/${editPlan.id}`, editPlan);
      toast.success('Plan updated');
      setShowPlanModal(false);
      setRefresh(r => r + 1);
    } catch {
      toast.error('Failed to update plan');
    }
  };
  const createPlan = async () => {
    try {
      await axios.post('/api/admin/subscription-plans', editPlan);
      toast.success('Plan created');
      setShowPlanModal(false);
      setRefresh(r => r + 1);
    } catch {
      toast.error('Failed to create plan');
    }
  };

  const openAssignModal = async (userId) => {
    setAssignUserId(userId);
    if (plans.length === 0) {
      const res = await axios.get('/api/admin/subscription-plans');
      setPlans(res.data);
    }
    setAssignPlanId('');
    setShowAssignModal(true);
  };
  const assignPlan = async () => {
    await axios.post('/api/admin/assign-subscription', { user_id: assignUserId, plan_id: assignPlanId });
    toast.success('Plan assigned');
    setShowAssignModal(false);
  };
  const openSubsModal = async (userId) => {
    setSubsUserId(userId);
    const res = await axios.get(`/api/admin/user/${userId}/subscriptions`);
    setUserSubs(res.data);
    setShowSubsModal(true);
  };

  // Add placeholder handlers if not present
  const openApplicationModal = (application, mode) => alert(`${mode} application: ${application.id}`);
  const openReviewModal = (review, mode) => alert(`${mode} review: ${review.id}`);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.user_type.toLowerCase().includes(userSearch.toLowerCase())
  );

  const userPageCount = Math.ceil(filteredUsers.length / 10);
  const userStart = (userPage - 1) * 10;
  const userEnd = userStart + 10;
  const currentUsers = filteredUsers.slice(userStart, userEnd);

  const filteredOpportunities = opportunities.filter(o =>
    o.title.toLowerCase().includes(oppSearch.toLowerCase()) ||
    o.description.toLowerCase().includes(oppSearch.toLowerCase()) ||
    o.status.toLowerCase().includes(oppSearch.toLowerCase())
  );

  const oppPageCount = Math.ceil(filteredOpportunities.length / 10);
  const oppStart = (oppPage - 1) * 10;
  const oppEnd = oppStart + 10;
  const currentOpportunities = filteredOpportunities.slice(oppStart, oppEnd);

  const filteredApplications = applications.filter(a =>
    a.cover_letter?.toLowerCase().includes(appSearch.toLowerCase()) ||
    a.status.toLowerCase().includes(appSearch.toLowerCase())
  );

  const appPageCount = Math.ceil(filteredApplications.length / 10);
  const appStart = (appPage - 1) * 10;
  const appEnd = appStart + 10;
  const currentApplications = filteredApplications.slice(appStart, appEnd);

  const filteredReviews = reviews.filter(r =>
    r.clinic_name.toLowerCase().includes(reviewSearch.toLowerCase()) ||
    r.trainee_name.toLowerCase().includes(reviewSearch.toLowerCase()) ||
    r.feedback.toLowerCase().includes(reviewSearch.toLowerCase())
  );

  const reviewPageCount = Math.ceil(filteredReviews.length / 10);
  const reviewStart = (reviewPage - 1) * 10;
  const reviewEnd = reviewStart + 10;
  const currentReviews = filteredReviews.slice(reviewStart, reviewEnd);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Only render the content for the current tab. No internal tab bar. */}
      {loading ? <div>Loading...</div> : (
        <>
          {tab === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">User Types</h3>
                  <Pie
                    data={{
                      labels: ['Clinics', 'Trainees', 'Admins'],
                      datasets: [{
                        data: [users.filter(u => u.user_type === 'clinic').length, users.filter(u => u.user_type === 'trainee').length, users.filter(u => u.user_type === 'admin').length],
                        backgroundColor: ['#3b82f6', '#f59e42', '#10b981'],
                      }]
                    }}
                  />
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Opportunities Over Time</h3>
                  <Line
                    data={{
                      labels: opportunities.map(o => o.created_at?.slice(0, 10)),
                      datasets: [{
                        label: 'Opportunities',
                        data: opportunities.map((_, i) => i + 1),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59,130,246,0.2)',
                        fill: true,
                      }]
                    }}
                  />
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Applications Over Time</h3>
                  <Line
                    data={{
                      labels: applications.map(a => a.applied_at?.slice(0, 10)),
                      datasets: [{
                        label: 'Applications',
                        data: applications.map((_, i) => i + 1),
                        borderColor: '#f59e42',
                        backgroundColor: 'rgba(245,158,66,0.2)',
                        fill: true,
                      }]
                    }}
                  />
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Revenue</h3>
                  <Bar
                    data={{
                      labels: payStats?.byMonth?.map(m => m.month) || [],
                      datasets: [{
                        label: 'Revenue',
                        data: payStats?.byMonth?.map(m => m.total) || [],
                        backgroundColor: '#10b981',
                      }]
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Users</h3>
                  <p className="text-2xl font-bold text-primary-600">{users.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Clinics</h3>
                  <p className="text-2xl font-bold text-primary-600">{users.filter(u => u.user_type === 'clinic').length}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Trainees</h3>
                  <p className="text-2xl font-bold text-primary-600">{users.filter(u => u.user_type === 'trainee').length}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Opportunities</h3>
                  <p className="text-2xl font-bold text-primary-600">{opportunities.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Applications</h3>
                  <p className="text-2xl font-bold text-primary-600">{applications.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Reviews</h3>
                  <p className="text-2xl font-bold text-primary-600">{reviews.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Revenue</h3>
                  <p className="text-2xl font-bold text-primary-600">${payStats?.totalRevenue || 0}</p>
                </div>
              </div>
            </>
          )}
          {tab === 'users' && (
            <>
              <div className="flex flex-wrap items-center justify-between mb-2 gap-2">
                <input
                  type="text"
                  placeholder="Search users..."
                  className="input-field w-64"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <button
                    className="btn-secondary"
                    disabled={userPage === 1}
                    onClick={() => setUserPage(p => Math.max(1, p - 1))}
                  >Prev</button>
                  <span className="text-sm font-medium">Page {userPage}</span>
                  <button
                    className="btn-secondary"
                    disabled={userPage * 10 >= filteredUsers.length}
                    onClick={() => setUserPage(p => p + 1)}
                  >Next</button>
                </div>
              </div>
              <table className="min-w-full w-full bg-white rounded-lg shadow border text-sm align-top">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 border text-left">ID</th>
                    <th className="px-6 py-3 border text-left">Name</th>
                    <th className="px-6 py-3 border text-left">Email</th>
                    <th className="px-6 py-3 border text-left">Type</th>
                    <th className="px-6 py-3 border text-left">Created</th>
                    <th className="px-6 py-3 border text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map(u => (
                    <tr key={u.id} className="even:bg-gray-50 hover:bg-primary-50 transition-colors">
                      <td className="px-6 py-3 border">{u.id}</td>
                      <td className="px-6 py-3 border">{u.name}</td>
                      <td className="px-6 py-3 border">{u.email}</td>
                      <td className="px-6 py-3 border">{u.user_type}</td>
                      <td className="px-6 py-3 border">{u.created_at}</td>
                      <td className="px-6 py-3 border relative">
                        <div className="relative inline-block text-left">
                          <button
                            className="btn-primary flex items-center gap-1 px-3 py-1 rounded-full shadow hover:bg-primary-700 focus:outline-none"
                            onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)}
                            title="Actions"
                          >
                            <List className="w-4 h-4" /> Actions
                          </button>
                          {openMenu === u.id && (
                            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-10 w-44 bg-white border border-gray-200 rounded-lg shadow-lg animate-fade-in whitespace-nowrap">
                              <button className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 text-blue-700" onMouseDown={e => { e.stopPropagation(); openUserModal(u, 'view'); setOpenMenu(null); }} title="View user details"><Eye className="w-4 h-4"/>View</button>
                              <button className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 text-indigo-700" onMouseDown={e => { e.stopPropagation(); openUserModal(u, 'edit'); setOpenMenu(null); }} title="Edit user"><Edit className="w-4 h-4"/>Edit</button>
                              <button className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 text-red-600" onMouseDown={e => { e.stopPropagation(); deleteUser(u.id); setOpenMenu(null); }} title="Delete user"><Trash2 className="w-4 h-4"/>Delete</button>
                              <button className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 text-green-700" onMouseDown={e => { e.stopPropagation(); openAssignModal(u.id); setOpenMenu(null); }} title="Assign subscription plan"><Gift className="w-4 h-4"/>Assign Plan</button>
                              <button className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 text-gray-700" onMouseDown={e => { e.stopPropagation(); openSubsModal(u.id); setOpenMenu(null); }} title="View user subscriptions"><Eye className="w-4 h-4"/>View Subs</button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">User Type Distribution</h3>
                  <Pie
                    data={{
                      labels: ['Clinics', 'Trainees', 'Admins'],
                      datasets: [{
                        data: [users.filter(u => u.user_type === 'clinic').length, users.filter(u => u.user_type === 'trainee').length, users.filter(u => u.user_type === 'admin').length],
                        backgroundColor: ['#3b82f6', '#f59e42', '#10b981'],
                      }]
                    }}
                  />
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">User Registrations by Date</h3>
                  <Bar
                    data={{
                      labels: Array.from(new Set(users.map(u => u.created_at?.slice(0,10)))).sort(),
                      datasets: [{
                        label: 'Registrations',
                        data: Array.from(new Set(users.map(u => u.created_at?.slice(0,10)))).sort().map(date => users.filter(u => u.created_at?.slice(0,10) === date).length),
                        backgroundColor: '#3b82f6',
                      }]
                    }}
                  />
                </div>
              </div>
            </>
          )}
          {tab === 'opps' && (
            <>
              <div className="flex flex-wrap items-center justify-between mb-2 gap-2">
                <input
                  type="text"
                  placeholder="Search opportunities..."
                  className="input-field w-64"
                  value={oppSearch}
                  onChange={e => setOppSearch(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <button
                    className="btn-secondary"
                    disabled={oppPage === 1}
                    onClick={() => setOppPage(p => Math.max(1, p - 1))}
                  >Prev</button>
                  <span className="text-sm font-medium">Page {oppPage}</span>
                  <button
                    className="btn-secondary"
                    disabled={oppPage * 10 >= filteredOpportunities.length}
                    onClick={() => setOppPage(p => p + 1)}
                  >Next</button>
                </div>
              </div>
              <table className="min-w-full w-full bg-white rounded-lg shadow border text-sm align-top">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 border text-left">ID</th>
                    <th className="px-6 py-3 border text-left">Title</th>
                    <th className="px-6 py-3 border text-left">Clinic ID</th>
                    <th className="px-6 py-3 border text-left">Status</th>
                    <th className="px-6 py-3 border text-left">Created</th>
                    <th className="px-6 py-3 border text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOpportunities.map(o => (
                    <tr key={o.id} className="even:bg-gray-50 hover:bg-primary-50 transition-colors">
                      <td className="px-6 py-3 border">{o.id}</td>
                      <td className="px-6 py-3 border">{o.title}</td>
                      <td className="px-6 py-3 border">{o.clinic_id}</td>
                      <td className="px-6 py-3 border">{o.status}</td>
                      <td className="px-6 py-3 border">{o.created_at}</td>
                      <td className="px-6 py-3 border">
                        <div className="flex justify-center items-center h-full relative">
                          <button className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition font-semibold" onClick={() => setOpenActionMenu({type: 'opp', id: o.id})} ref={el => actionMenuRef.current[`opp-${o.id}`] = el}>
                            <List className="h-4 w-4" /> Actions
                          </button>
                          {openActionMenu.type === 'opp' && openActionMenu.id === o.id && (
                            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-white border rounded shadow-lg min-w-[140px] z-20 whitespace-nowrap">
                              <button className="block w-full text-left px-4 py-2 hover:bg-primary-50" onMouseDown={e => { e.stopPropagation(); openOppModal(o, 'view'); setOpenActionMenu({}); }}>View</button>
                              <button className="block w-full text-left px-4 py-2 hover:bg-primary-50" onMouseDown={e => { e.stopPropagation(); openOppModal(o, 'edit'); setOpenActionMenu({}); }}>Edit</button>
                              <button className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-600" onMouseDown={e => { e.stopPropagation(); deleteOpportunity(o.id); setOpenActionMenu({}); }}>Delete</button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Opportunities by Clinic</h3>
                  <Bar
                    data={{
                      labels: Array.from(new Set(opportunities.map(o => o.clinic_id))).map(cid => `Clinic ${cid}`),
                      datasets: [{
                        label: 'Opportunities',
                        data: Array.from(new Set(opportunities.map(o => o.clinic_id))).map(cid => opportunities.filter(o => o.clinic_id === cid).length),
                        backgroundColor: '#3b82f6',
                      }]
                    }}
                  />
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Opportunities Over Time</h3>
                  <Line
                    data={{
                      labels: Array.from(new Set(opportunities.map(o => o.created_at?.slice(0,10)))).sort(),
                      datasets: [{
                        label: 'Opportunities',
                        data: Array.from(new Set(opportunities.map(o => o.created_at?.slice(0,10)))).sort().map(date => opportunities.filter(o => o.created_at?.slice(0,10) === date).length),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59,130,246,0.2)',
                        fill: true,
                      }]
                    }}
                  />
                </div>
              </div>
            </>
          )}
          {tab === 'apps' && (
            <>
              <div className="flex flex-wrap items-center justify-between mb-2 gap-2">
                <input
                  type="text"
                  placeholder="Search applications..."
                  className="input-field w-64"
                  value={appSearch}
                  onChange={e => setAppSearch(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <button
                    className="btn-secondary"
                    disabled={appPage === 1}
                    onClick={() => setAppPage(p => Math.max(1, p - 1))}
                  >Prev</button>
                  <span className="text-sm font-medium">Page {appPage}</span>
                  <button
                    className="btn-secondary"
                    disabled={appPage * 10 >= filteredApplications.length}
                    onClick={() => setAppPage(p => p + 1)}
                  >Next</button>
                </div>
              </div>
              <table className="min-w-full w-full bg-white rounded-lg shadow border text-sm align-top">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 border text-left">ID</th>
                    <th className="px-6 py-3 border text-left">Trainee</th>
                    <th className="px-6 py-3 border text-left">Opportunity</th>
                    <th className="px-6 py-3 border text-left">Status</th>
                    <th className="px-6 py-3 border text-left">Applied</th>
                    <th className="px-6 py-3 border text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentApplications.map(a => (
                    <tr key={a.id} className="even:bg-gray-50 hover:bg-primary-50 transition-colors">
                      <td className="px-6 py-3 border">{a.id}</td>
                      <td className="px-6 py-3 border">{a.trainee_name || a.trainee_id}</td>
                      <td className="px-6 py-3 border">{a.title}</td>
                      <td className="px-6 py-3 border">{a.status}</td>
                      <td className="px-6 py-3 border">{a.applied_at}</td>
                      <td className="px-6 py-3 border">
                        <div className="flex justify-center items-center h-full relative">
                          <button className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition font-semibold" onClick={() => setOpenActionMenu({type: 'app', id: a.id})} ref={el => actionMenuRef.current[`app-${a.id}`] = el}>
                            <List className="h-4 w-4" /> Actions
                          </button>
                          {openActionMenu.type === 'app' && openActionMenu.id === a.id && (
                            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-white border rounded shadow-lg min-w-[140px] z-20 whitespace-nowrap">
                              <button className="block w-full text-left px-4 py-2 hover:bg-primary-50" onMouseDown={e => { e.stopPropagation(); openApplicationModal(a, 'view'); setOpenActionMenu({}); }}>View</button>
                              <button className="block w-full text-left px-4 py-2 hover:bg-primary-50" onMouseDown={e => { e.stopPropagation(); openApplicationModal(a, 'edit'); setOpenActionMenu({}); }}>Edit</button>
                              <button className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-600" onMouseDown={e => { e.stopPropagation(); deleteApplication(a.id); setOpenActionMenu({}); }}>Delete</button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          {tab === 'reviews' && (
            <>
              <div className="flex flex-wrap items-center justify-between mb-2 gap-2">
                <input
                  type="text"
                  placeholder="Search reviews..."
                  className="input-field w-64"
                  value={reviewSearch}
                  onChange={e => setReviewSearch(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <button
                    className="btn-secondary"
                    disabled={reviewPage === 1}
                    onClick={() => setReviewPage(p => Math.max(1, p - 1))}
                  >Prev</button>
                  <span className="text-sm font-medium">Page {reviewPage}</span>
                  <button
                    className="btn-secondary"
                    disabled={reviewPage * 10 >= filteredReviews.length}
                    onClick={() => setReviewPage(p => p + 1)}
                  >Next</button>
                </div>
              </div>
              <table className="min-w-full w-full bg-white rounded-lg shadow border text-sm align-top">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 border text-left">ID</th>
                    <th className="px-6 py-3 border text-left">Clinic</th>
                    <th className="px-6 py-3 border text-left">Trainee</th>
                    <th className="px-6 py-3 border text-left">Rating</th>
                    <th className="px-6 py-3 border text-left">Feedback</th>
                    <th className="px-6 py-3 border text-left">Created</th>
                    <th className="px-6 py-3 border text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentReviews.map(r => (
                    <tr key={r.id} className="even:bg-gray-50 hover:bg-primary-50 transition-colors">
                      <td className="px-6 py-3 border">{r.id}</td>
                      <td className="px-6 py-3 border">{r.clinic_name || r.clinic_id}</td>
                      <td className="px-6 py-3 border">{r.trainee_name || r.trainee_id}</td>
                      <td className="px-6 py-3 border">{r.rating}</td>
                      <td className="px-6 py-3 border">{r.feedback}</td>
                      <td className="px-6 py-3 border">{r.created_at}</td>
                      <td className="px-6 py-3 border">
                        <div className="flex justify-center items-center h-full relative">
                          <button className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition font-semibold" onClick={() => setOpenActionMenu({type: 'review', id: r.id})} ref={el => actionMenuRef.current[`review-${r.id}`] = el}>
                            <List className="h-4 w-4" /> Actions
                          </button>
                          {openActionMenu.type === 'review' && openActionMenu.id === r.id && (
                            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-white border rounded shadow-lg min-w-[140px] z-20 whitespace-nowrap">
                              <button className="block w-full text-left px-4 py-2 hover:bg-primary-50" onMouseDown={e => { e.stopPropagation(); openReviewModal(r, 'view'); setOpenActionMenu({}); }}>View</button>
                              <button className="block w-full text-left px-4 py-2 hover:bg-primary-50" onMouseDown={e => { e.stopPropagation(); openReviewModal(r, 'edit'); setOpenActionMenu({}); }}>Edit</button>
                              <button className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-600" onMouseDown={e => { e.stopPropagation(); deleteReview(r.clinic_id, r.id); setOpenActionMenu({}); }}>Delete</button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Rating Distribution</h3>
                  <Pie
                    data={{
                      labels: ['5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'],
                      datasets: [{
                        data: [5, 4, 3, 2, 1].map(star => filteredReviews.filter(r => r.rating === star).length),
                        backgroundColor: ['#10b981', '#3b82f6', '#f59e42', '#fbbf24', '#ef4444'],
                      }]
                    }}
                  />
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Reviews by Date</h3>
                  <Bar
                    data={{
                      labels: Array.from(new Set(filteredReviews.map(r => r.created_at?.slice(0,10)))).sort(),
                      datasets: [{
                        label: 'Reviews',
                        data: Array.from(new Set(filteredReviews.map(r => r.created_at?.slice(0,10)))).sort().map(date => filteredReviews.filter(r => r.created_at?.slice(0,10) === date).length),
                        backgroundColor: '#10b981',
                      }]
                    }}
                  />
                </div>
              </div>
            </>
          )}
          {tab === 'subs' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Plan Popularity (Users per Plan)</h3>
                  <Pie
                    data={{
                      labels: subStats?.byPlanUsers?.map(p => p.plan_type) || [],
                      datasets: [{
                        data: subStats?.byPlanUsers?.map(p => p.user_count) || [],
                        backgroundColor: ['#3b82f6', '#f59e42', '#10b981', '#6366f1', '#f43f5e', '#fbbf24'],
                      }]
                    }}
                    options={{
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const label = context.label || '';
                              const value = context.parsed || 0;
                              return `${label}: ${value} user${value === 1 ? '' : 's'}`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Plan Prices</h3>
                  <Bar
                    data={{
                      labels: plans.map(p => p.name),
                      datasets: [{
                        label: 'Price',
                        data: plans.map(p => p.price),
                        backgroundColor: '#3b82f6',
                      }]
                    }}
                  />
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Plan Durations</h3>
                  <Bar
                    data={{
                      labels: plans.map(p => p.name),
                      datasets: [{
                        label: 'Duration (days)',
                        data: plans.map(p => p.duration_days),
                        backgroundColor: '#10b981',
                      }]
                    }}
                  />
                </div>
              </div>
              <button className="btn-primary mb-2" onMouseDown={e => { e.stopPropagation(); openPlanModal(initialPlan, 'create'); }}>Create Plan</button>
              <table className="min-w-full w-full bg-white rounded-lg shadow border text-sm align-top">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 border text-left">ID</th>
                    <th className="px-6 py-3 border text-left">Name</th>
                    <th className="px-6 py-3 border text-left">Price</th>
                    <th className="px-6 py-3 border text-left">Applications Limit (Trainee)</th>
                    <th className="px-6 py-3 border text-left">Opportunities Limit (Clinic)</th>
                    <th className="px-6 py-3 border text-left">Duration</th>
                    <th className="px-6 py-3 border text-left">Description</th>
                    <th className="px-6 py-3 border text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map(p => (
                    <tr key={p.id} className="even:bg-gray-50 hover:bg-primary-50 transition-colors">
                      <td className="px-6 py-3 border">{p.id}</td>
                      <td className="px-6 py-3 border">{p.name}</td>
                      <td className="px-6 py-3 border">{p.price}</td>
                      <td className="px-6 py-3 border">{p.applications_limit}</td>
                      <td className="px-6 py-3 border">{p.opportunities_limit}</td>
                      <td className="px-6 py-3 border">{p.duration_days} Days</td>
                      <td className="px-6 py-3 border">{p.description}</td>
                      <td className="px-6 py-3 border">
                        <div className="flex justify-center items-center h-full relative">
                          <button className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition font-semibold" onClick={() => setOpenActionMenu({type: 'plan', id: p.id})} ref={el => actionMenuRef.current[`plan-${p.id}`] = el}>
                            <List className="h-4 w-4" /> Actions
                          </button>
                          {openActionMenu.type === 'plan' && openActionMenu.id === p.id && (
                            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-white border rounded shadow-lg min-w-[140px] z-20 whitespace-nowrap">
                              <button className="block w-full text-left px-4 py-2 hover:bg-primary-50" onMouseDown={e => { e.stopPropagation(); openPlanModal(p, 'view'); setOpenActionMenu({}); }}>View</button>
                              <button className="block w-full text-left px-4 py-2 hover:bg-primary-50" onMouseDown={e => { e.stopPropagation(); openPlanModal(p, 'edit'); setOpenActionMenu({}); }}>Edit</button>
                              <button className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-600" onMouseDown={e => { e.stopPropagation(); deletePlan(p.id); setOpenActionMenu({}); }}>Delete</button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 min-w-[320px] max-w-md relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={()=>setShowUserModal(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-4">{modalMode==='edit' ? 'Edit User' : 'User Details'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" className="input-field" value={editUser.name} disabled={modalMode==='view'} onChange={e=>setEditUser({...editUser, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" className="input-field" value={editUser.email} disabled readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select className="input-field" value={editUser.user_type} disabled={modalMode==='view'} onChange={e=>setEditUser({...editUser, user_type: e.target.value})}>
                  <option value="trainee">Trainee</option>
                  <option value="clinic">Clinic</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Created</label>
                <input type="text" className="input-field" value={editUser.created_at} disabled readOnly />
              </div>
            </div>
            {modalMode==='edit' && (
              <button className="btn-primary mt-6 w-full" onClick={updateUser}>Save Changes</button>
            )}
          </div>
        </div>
      )}
      {/* Opportunity Modal */}
      {showOppModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 min-w-[320px] max-w-md relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={()=>setShowOppModal(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-4">{modalMode==='edit' ? 'Edit Opportunity' : 'Opportunity Details'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input type="text" className="input-field" value={editOpp.title} disabled={modalMode==='view'} onChange={e=>setEditOpp({...editOpp, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea className="input-field" value={editOpp.description} disabled={modalMode==='view'} onChange={e=>setEditOpp({...editOpp, description: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Clinic ID</label>
                <input type="text" className="input-field" value={editOpp.clinic_id} disabled={modalMode==='view'} onChange={e=>setEditOpp({...editOpp, clinic_id: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <input type="text" className="input-field" value={editOpp.status} disabled={modalMode==='view'} onChange={e=>setEditOpp({...editOpp, status: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Created</label>
                <input type="text" className="input-field" value={editOpp.created_at} disabled readOnly />
              </div>
            </div>
            {modalMode==='edit' && (
              <button className="btn-primary mt-6 w-full" onClick={updateOpportunity}>Save Changes</button>
            )}
          </div>
        </div>
      )}
          {showPlanModal && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-lg shadow-lg min-w-[400px] max-w-xl w-full">
                <h2 className="text-2xl font-bold mb-6">{modalMode==='create' ? 'Create' : modalMode==='edit' ? 'Edit' : 'View'} Plan</h2>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input className="input w-full border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Plan name" value={editPlan.name} onChange={e=>setEditPlan(p=>({...p, name: e.target.value}))} disabled={modalMode==='view'} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                      <input className="input w-full border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="e.g. 1000" type="number" value={editPlan.price} onChange={e=>setEditPlan(p=>({...p, price: e.target.value}))} disabled={modalMode==='view'} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Applications Limit (Trainee)</label>
                      <input className="input w-full border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="e.g. 10" type="number" value={editPlan.applications_limit} onChange={e=>setEditPlan(p=>({...p, applications_limit: e.target.value}))} disabled={modalMode==='view'} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Opportunities Limit (Clinic)</label>
                      <input className="input w-full border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="e.g. 20" type="number" value={editPlan.opportunities_limit} onChange={e=>setEditPlan(p=>({...p, opportunities_limit: e.target.value}))} disabled={modalMode==='view'} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                      <input className="input w-full border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="e.g. 30" type="number" value={editPlan.duration_days} onChange={e=>setEditPlan(p=>({...p, duration_days: e.target.value}))} disabled={modalMode==='view'} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea className="input w-full border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Plan description" value={editPlan.description} onChange={e=>setEditPlan(p=>({...p, description: e.target.value}))} disabled={modalMode==='view'} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <button type="button" className="btn-secondary" onClick={()=>setShowPlanModal(false)}>Close</button>
                    {modalMode==='edit' && <button type="button" className="btn-primary" onClick={updatePlan}>Save</button>}
                    {modalMode==='create' && <button type="button" className="btn-primary" onClick={createPlan}>Create</button>}
                  </div>
                </form>
              </div>
            </div>
          )}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg min-w-[350px] max-w-[90vw]">
            <h2 className="text-xl font-bold mb-4">Assign Subscription Plan</h2>
            <select className="input w-full mb-4" value={assignPlanId} onChange={e=>setAssignPlanId(e.target.value)}>
              <option value="">Select Plan</option>
              {plans.map(p => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
            </select>
            <div className="flex gap-2 mt-4">
              <button className="btn-secondary" onClick={()=>setShowAssignModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={assignPlan} disabled={!assignPlanId}>Assign</button>
            </div>
          </div>
        </div>
      )}
      {showSubsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg min-w-[350px] max-w-[90vw]">
            <h2 className="text-xl font-bold mb-4">User Subscriptions</h2>
            <table className="min-w-full bg-white border mb-4">
              <thead>
                <tr>
                  <th className="px-2 py-1 border">Plan</th>
                  <th className="px-2 py-1 border">Apps Limit</th>
                  <th className="px-2 py-1 border">Opps Limit</th>
                  <th className="px-2 py-1 border">Expires</th>
                </tr>
              </thead>
              <tbody>
                {userSubs.map(s => (
                  <tr key={s.id}>
                    <td className="px-2 py-1 border">{s.plan_type}</td>
                    <td className="px-2 py-1 border">{s.applications_limit}</td>
                    <td className="px-2 py-1 border">{s.opportunities_limit}</td>
                    <td className="px-2 py-1 border">{s.expires_at?.slice(0,10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="btn-secondary" onClick={()=>setShowSubsModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin; 