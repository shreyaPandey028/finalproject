import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import axiosClient from '../utils/axiosClient';
import { Calendar, Clock, Users, Trophy, ArrowRight, AlertCircle } from 'lucide-react';
import { useSelector } from 'react-redux';

function ContestsListPage() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
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

    if (now < startTime) return { status: 'upcoming', label: 'Upcoming' };
    if (now > endTime) return { status: 'ended', label: 'Ended' };
    return { status: 'active', label: 'Active' };
  };

  const isParticipant = (contest) => {
    if (!user) return false;
    return contest.participants?.some(p => p.userId?._id === user._id || p.userId === user._id);
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
          <h1 className="text-3xl font-bold">Contests</h1>
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/admin/contests')}
              className="btn btn-primary"
            >
              Manage Contests
            </button>
          )}
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            <AlertCircle className="w-6 h-6" />
            <span>{error}</span>
          </div>
        )}

        {contests.length === 0 ? (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body text-center py-12">
              <p className="text-xl">No contests available</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {contests.map((contest) => {
              const statusInfo = getContestStatus(contest);
              const participated = isParticipant(contest);
              
              return (
                <div key={contest._id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                  <div className="card-body">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="card-title text-2xl">{contest.title}</h2>
                          <span className={`badge ${getStatusBadge(statusInfo.status)} badge-lg`}>
                            {statusInfo.label}
                          </span>
                          {participated && (
                            <span className="badge badge-success badge-lg">Joined</span>
                          )}
                        </div>
                        <p className="text-base-content/70 mb-4">{contest.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            <div>
                              <p className="text-sm text-base-content/70">Start Time</p>
                              <p className="font-semibold">{formatDate(contest.startTime)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            <div>
                              <p className="text-sm text-base-content/70">Duration</p>
                              <p className="font-semibold">{contest.duration} minutes</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            <div>
                              <p className="text-sm text-base-content/70">Participants</p>
                              <p className="font-semibold">{contest.participants?.length || 0}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <span className="badge badge-outline badge-lg">
                            {contest.problems?.length || 0} Problems
                          </span>
                          {contest.createdBy && (
                            <span className="badge badge-outline badge-lg">
                              By {contest.createdBy.firstName} {contest.createdBy.lastName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="card-actions justify-end mt-4">
                      <button
                        onClick={() => navigate(`/contests/${contest._id}`)}
                        className="btn btn-primary"
                      >
                        {participated ? 'Continue' : 'Join Contest'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </button>
                      <button
                        onClick={() => navigate(`/contests/${contest._id}/leaderboard`)}
                        className="btn btn-ghost"
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

export default ContestsListPage;

