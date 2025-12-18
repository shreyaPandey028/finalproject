import { useState, useEffect } from 'react';
import axiosClient from '../utils/axiosClient';
import { useNavigate } from 'react-router';
import { Calendar, Clock, Users, Trophy, Edit, Trash2, Eye } from 'lucide-react';

function AdminManageContests() {
  const navigate = useNavigate();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get('/contest');
      if (data.success) {
        setContests(data.contests);
      }
    } catch (err) {
      setError('Failed to fetch contests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'upcoming':
        return 'badge-info';
      case 'active':
        return 'badge-success';
      case 'ended':
        return 'badge-neutral';
      default:
        return 'badge-neutral';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getContestStatus = (contest) => {
    const now = new Date();
    const startTime = new Date(contest.startTime);
    const endTime = new Date(contest.endTime);

    if (now < startTime) return 'upcoming';
    if (now > endTime) return 'ended';
    return 'active';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Manage Contests</h1>
          <button
            onClick={() => navigate('/admin/contests/create')}
            className="btn btn-primary"
          >
            Create New Contest
          </button>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        {contests.length === 0 ? (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body text-center py-12">
              <p className="text-xl">No contests found</p>
              <button
                onClick={() => navigate('/admin/contests/create')}
                className="btn btn-primary mt-4"
              >
                Create Your First Contest
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {contests.map((contest) => {
              const status = getContestStatus(contest);
              return (
                <div key={contest._id} className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h2 className="card-title text-2xl mb-2">{contest.title}</h2>
                        <p className="text-base-content/70 mb-4">{contest.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            <div>
                              <p className="text-sm text-base-content/70">Start</p>
                              <p className="font-semibold">{formatDate(contest.startTime)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            <div>
                              <p className="text-sm text-base-content/70">End</p>
                              <p className="font-semibold">{formatDate(contest.endTime)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            <div>
                              <p className="text-sm text-base-content/70">Participants</p>
                              <p className="font-semibold">{contest.participants?.length || 0}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <span className={`badge ${getStatusBadge(status)} badge-lg`}>
                            {status.toUpperCase()}
                          </span>
                          <span className="badge badge-outline badge-lg">
                            {contest.problems?.length || 0} Problems
                          </span>
                          <span className="badge badge-outline badge-lg">
                            {contest.duration} minutes
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="card-actions justify-end mt-4">
                      <button
                        onClick={() => navigate(`/contests/${contest._id}`)}
                        className="btn btn-sm btn-primary"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </button>
                      <button
                        onClick={() => navigate(`/contests/${contest._id}/leaderboard`)}
                        className="btn btn-sm btn-info"
                      >
                        <Trophy className="w-4 h-4 mr-2" />
                        Leaderboard
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminManageContests;

