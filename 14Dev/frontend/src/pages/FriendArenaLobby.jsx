import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Users, Plus, LogIn, Code2, Flame, Trophy } from 'lucide-react';
import axiosClient from '../utils/axiosClient';

const FriendArenaLobby = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'join'
  const [topic, setTopic] = useState('array');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const topics = [
    { value: 'array', label: 'Array' },
    { value: 'linkedList', label: 'Linked List' },
    { value: 'graph', label: 'Graph' },
    { value: 'dp', label: 'Dynamic Programming' }
  ];

  const handleCreateRoom = async () => {
    if (!topic) {
      setError('Please select a topic');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axiosClient.post('/friend-arena/create', { topic });
      navigate(`/friend-arena/${response.data.arena.roomCode}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode || roomCode.length !== 6) {
      setError('Please enter a valid 6-character room code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axiosClient.post('/friend-arena/join', { roomCode });
      navigate(`/friend-arena/${response.data.arena.roomCode}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join room');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-600 to-red-600">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Friend Arena</h1>
              <p className="text-sm text-slate-400">Compete with your friends in real-time coding challenges</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Tabs */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold transition-all ${
                activeTab === 'create'
                  ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <Plus className="w-5 h-5" />
              Create Room
            </button>
            <button
              onClick={() => setActiveTab('join')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold transition-all ${
                activeTab === 'join'
                  ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <LogIn className="w-5 h-5" />
              Join Room
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
              {error}
            </div>
          )}

          {/* Create Room Form */}
          {activeTab === 'create' && (
            <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-orange-500" />
                Create a New Arena
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-3">
                    Select Topic
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {topics.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setTopic(t.value)}
                        className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                          topic === t.value
                            ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-500/30'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-start gap-3">
                    <Trophy className="w-5 h-5 text-amber-500 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-white mb-2">How it works:</h3>
                      <ul className="text-sm text-slate-400 space-y-1">
                        <li>• You'll get 2 questions based on your selected topic</li>
                        <li>• Share the room code with your friends</li>
                        <li>• Start the contest when everyone is ready</li>
                        <li>• Compete in real-time and see the leaderboard</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCreateRoom}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </div>
          )}

          {/* Join Room Form */}
          {activeTab === 'join' && (
            <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <LogIn className="w-5 h-5 text-orange-500" />
                Join an Arena
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-3">
                    Enter Room Code
                  </label>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
                    placeholder="ABCD12"
                    maxLength={6}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-center text-2xl font-bold tracking-widest px-4 py-4 rounded-lg focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-white mb-2">Important:</h3>
                      <ul className="text-sm text-slate-400 space-y-1">
                        <li>• You'll need to enable fullscreen mode</li>
                        <li>• Tab switching is monitored (max 1 switch allowed)</li>
                        <li>• Contest starts when the room creator begins it</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleJoinRoom}
                  disabled={loading || roomCode.length !== 6}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Joining...' : 'Join Room'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendArenaLobby;

