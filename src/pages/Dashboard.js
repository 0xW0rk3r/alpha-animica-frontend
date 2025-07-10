import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Briefcase, Users, FileText, TrendingUp, Calendar, MapPin, DollarSign } from 'lucide-react';
import Spinner from '../components/Spinner';
// REMOVE: import Modal from '../components/Modal';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    opportunities: 0,
    applications: 0,
    interviews: 0
  });
  const [recentOpportunities, setRecentOpportunities] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [subs, setSubs] = useState([]);
  const [plans, setPlans] = useState([]);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [subsError, setSubsError] = useState('');
  useEffect(() => {
    fetchDashboardData();
    fetchSubs();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch opportunities
      const opportunitiesRes = await axios.get('/api/opportunities?limit=5');
      setRecentOpportunities(opportunitiesRes.data.slice(0, 5));

      // Fetch applications
      const applicationsRes = await axios.get('/api/applications');
      setRecentApplications(applicationsRes.data.slice(0, 5));

      // Set stats based on user type
      if (user.userType === 'trainee') {
        setStats({
          opportunities: opportunitiesRes.data.length,
          applications: applicationsRes.data.length,
          interviews: applicationsRes.data.filter(app => app.status === 'interview').length
        });
      } else {
        setStats({
          opportunities: opportunitiesRes.data.filter(opp => opp.clinic_id === user.id).length,
          applications: applicationsRes.data.length,
          interviews: applicationsRes.data.filter(app => app.status === 'interview').length
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchSubs = async () => {
    setLoadingSubs(true);
    setSubsError('');
    try {
      const res = await axios.get('/api/user/subscriptions');
      setSubs(res.data);
    } catch (e) {
      setSubsError('Failed to load subscriptions. Please try again later.');
    } finally {
      setLoadingSubs(false);
    }
  };
  const openUpgrade = async () => {
    let res;
    if (user.userType === 'admin') {
      res = await axios.get('/api/admin/subscription-plans');
    } else {
      res = await axios.get('/api/subscription-plans');
    }
    setPlans(res.data);
    setShowUpgrade(true);
  };
  const handleUpgrade = async () => {
    // For demo, just assign plan (simulate payment)
    await axios.post('/api/admin/assign-subscription', { user_id: user.id, plan_id: selectedPlan });
    await fetchSubs();
    setShowUpgrade(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'interview': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening with your {user.userType === 'trainee' ? 'applications' : 'clinic'}.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Briefcase className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Opportunities</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.opportunities}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Applications</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.applications}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Interviews</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.interviews}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Opportunities */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Opportunities</h2>
              <Link
                to="/opportunities"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentOpportunities.length > 0 ? (
              <div className="space-y-4">
                {recentOpportunities.map((opportunity) => (
                  <div key={opportunity.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{opportunity.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          <Link
                            to={`/clinic/${opportunity.clinic_id}`}
                            className="text-primary-700 font-semibold hover:underline cursor-pointer"
                          >
                            {opportunity.clinic_name}
                          </Link>
                        </p>
                        <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {opportunity.location}
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            {opportunity.is_paid ? 'Paid' : 'Unpaid'}
                          </div>
                        </div>
                      </div>
                      <Link
                        to={`/opportunities/${opportunity.id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No opportunities found</p>
            )}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
              <Link
                to="/applications"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentApplications.length > 0 ? (
              <div className="space-y-4">
                {recentApplications.map((application) => (
                  <div key={application.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {user.userType === 'trainee' ? application.title : application.trainee_name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {user.userType === 'trainee' ? application.clinic_name : application.title}
                        </p>
                        <div className="flex items-center mt-2 space-x-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(application.status)}`}>
                            {application.status}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(application.applied_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No applications found</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">My Subscriptions</h2>
          {subsError && <div className="text-red-600 mb-2">{subsError} <button className="btn-secondary ml-2" onClick={fetchSubs}>Try Again</button></div>}
          {loadingSubs ? <Spinner /> : (
            subs.length === 0 && !subsError ? <div>No subscriptions yet.</div> : (
              <table className="min-w-full bg-white border mb-4">
                <thead>
                  <tr>
                    <th className="px-2 py-1 border">Plan</th>
                    {user.userType === 'trainee' && <th className="px-2 py-1 border">Apps Limit</th>}
                    {user.userType === 'clinic' && <th className="px-2 py-1 border">Opps Limit</th>}
                    <th className="px-2 py-1 border">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {subs.map(s => (
                    <tr key={s.id}>
                      <td className="px-2 py-1 border">{s.plan_type}</td>
                      {user.userType === 'trainee' && <td className="px-2 py-1 border">{s.applications_limit}</td>}
                      {user.userType === 'clinic' && <td className="px-2 py-1 border">{s.opportunities_limit}</td>}
                      <td className="px-2 py-1 border">{s.expires_at?.slice(0,10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
          <button className="btn-primary mt-2" onClick={openUpgrade}>Upgrade Subscription</button>
        </div>
      </div>
      {showUpgrade && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg min-w-[350px] max-w-[90vw] text-center">
            <h2 className="text-xl font-bold mb-4">Upgrade Subscription</h2>
            <div className="mb-6 text-gray-700 text-base">
              To upgrade your subscription, please contact the admin at
              <span className="font-semibold text-primary-700"> alphaanimica@gmail.com</span>.
            </div>
            {/* Display available plans as cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {plans.map(p => (
                <div key={p.id} className="border rounded-lg shadow p-4 text-left bg-gray-50">
                  <div className="font-bold text-lg mb-1">{p.name}</div>
                  <div className="text-primary-700 font-semibold mb-2">${p.price}</div>
                  <div className="text-sm mb-1">Applications Limit: {p.applications_limit ?? '-'}</div>
                  <div className="text-sm mb-1">Opportunities Limit: {p.opportunities_limit ?? '-'}</div>
                  <div className="text-sm mb-1">Duration: {p.duration_days} days</div>
                  <div className="text-xs text-gray-600 mt-2">{p.description}</div>
                </div>
              ))}
            </div>
            <button className="btn-primary w-32" onClick={()=>setShowUpgrade(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 