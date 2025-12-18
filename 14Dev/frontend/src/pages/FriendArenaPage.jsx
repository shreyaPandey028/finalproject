import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import axiosClient from '../utils/axiosClient';
import { Clock, Trophy, Code2, CheckCircle, XCircle, Play, Send, AlertCircle, Users, ArrowLeft, FileText, Flag, Zap, Flame } from 'lucide-react';
import { useSelector } from 'react-redux';

const langMap = {
  cpp: 'C++',
  java: 'Java',
  javascript: 'JavaScript'
};

function FriendArenaPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [arena, setArena] = useState(null);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [activeRightTab, setActiveRightTab] = useState('code');
  const [activeLeftTab, setActiveLeftTab] = useState('description');
  const socketRef = useRef(null);
  const editorRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const userEndTimeRef = useRef(null);
  const tabSwitchCountRef = useRef(0);
  const visibilityChangeRef = useRef(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    fetchArena();
  }, [roomCode]);

  useEffect(() => {
    // Fullscreen detection
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    // Tab switch detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (arena?.status === 'active' && !isDisqualified) {
          tabSwitchCountRef.current += 1;
          setTabSwitches(tabSwitchCountRef.current);
          
          // Track tab switch on server
          if (tabSwitchCountRef.current > 0) {
            axiosClient.post('/friend-arena/track-tab-switch', { roomCode })
              .then(response => {
                if (response.data.isDisqualified) {
                  setIsDisqualified(true);
                  alert('You have been disqualified for switching tabs more than once!');
                }
              })
              .catch(err => console.error('Error tracking tab switch:', err));
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [arena, roomCode, isDisqualified]);

  useEffect(() => {
    if (!roomCode || !user) return;

    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    };

    socketRef.current = io('http://localhost:3000', {
      auth: {
        token: getCookie('token')
      },
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to Friend Arena');
      if (roomCode) {
        socketRef.current.emit('join-friend-arena', roomCode);
      }
    });

    socketRef.current.on('friend-arena-leaderboard-update', (updatedLeaderboard) => {
      setLeaderboard(updatedLeaderboard);
    });

    socketRef.current.on('friend-arena-data', (data) => {
      if (data.arena) {
        setArena(data.arena);
        setLeaderboard(data.arena.leaderboard || []);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-friend-arena', roomCode);
        socketRef.current.disconnect();
      }
    };
  }, [roomCode, user]);

  useEffect(() => {
    if (arena?.status === 'active' && arena.participants) {
      const participant = arena.participants.find(
        p => p.userId._id === user?._id || p.userId === user?._id
      );

      if (participant && participant.endTime) {
        userEndTimeRef.current = new Date(participant.endTime);
        startTimer();
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [arena, user]);

  const startTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    timerIntervalRef.current = setInterval(() => {
      if (userEndTimeRef.current) {
        const now = new Date();
        const remaining = Math.max(0, userEndTimeRef.current - now);
        setTimeRemaining(remaining);

        if (remaining <= 0) {
          clearInterval(timerIntervalRef.current);
          setContestEnded(true);
        }
      }
    }, 1000);
  };

  const fetchArena = async () => {
    try {
      const response = await axiosClient.get(`/friend-arena/${roomCode}`);
      setArena(response.data.arena);
      setLeaderboard(response.data.arena.leaderboard || []);
      
      if (response.data.arena.problems && response.data.arena.problems.length > 0) {
        setSelectedProblem(response.data.arena.problems[0]);
        const initialCode = response.data.arena.problems[0].startCode?.find(
          sc => sc.language === langMap[selectedLanguage]
        )?.initialCode || '';
        setCode(initialCode);
      }

      const participant = response.data.arena.participants?.find(
        p => (p.userId._id || p.userId) === user?._id
      );
      
      if (participant) {
        setTabSwitches(participant.tabSwitches || 0);
        setIsDisqualified(participant.isDisqualified || false);
      }
    } catch (error) {
      console.error('Error fetching arena:', error);
    }
  };

  const requestFullscreen = async () => {
    try {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      }
      setShowFullscreenWarning(false);
    } catch (err) {
      console.error('Error requesting fullscreen:', err);
      alert('Please enable fullscreen manually');
    }
  };

  const handleStartContest = async () => {
    if (!isFullscreen) {
      alert('Please enable fullscreen mode first');
      return;
    }

    try {
      await axiosClient.post('/friend-arena/start', { roomCode });
      fetchArena();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to start contest');
    }
  };

  const handleEndContest = async () => {
    if (window.confirm('Are you sure you want to end the contest? This will end it for all participants.')) {
      try {
        const response = await axiosClient.post('/friend-arena/end', { roomCode });
        setArena(response.data.arena);
        setLeaderboard(response.data.leaderboard);
        // Refresh arena data to show ended state
        fetchArena();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to end contest');
      }
    }
  };

  const handleRun = async () => {
    if (!selectedProblem) return;
    
    setRunning(true);
    setRunResult(null);
    
    try {
      const response = await axiosClient.post('/friend-arena/run', {
        roomCode,
        problemId: selectedProblem._id,
        code,
        language: selectedLanguage
      });

      setRunResult(response.data);
      setActiveRightTab('testcase');
    } catch (error) {
      console.error('Error running code:', error);
      setRunResult({
        success: false,
        error: 'Internal server error'
      });
      setActiveRightTab('testcase');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedProblem) return;
    
    setSubmitting(true);
    setSubmitResult(null);
    
    try {
      const response = await axiosClient.post('/friend-arena/submit', {
        roomCode,
        problemId: selectedProblem._id,
        code,
        language: selectedLanguage
      });

      setSubmitResult(response.data);
      setLeaderboard(response.data.leaderboard || []);
      setActiveRightTab('result');
      
      // Refresh arena data
      fetchArena();
    } catch (error) {
      console.error('Error submitting code:', error);
      setSubmitResult(null);
      setActiveRightTab('result');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getLanguageForMonaco = (lang) => {
    switch (lang) {
      case 'javascript': return 'javascript';
      case 'java': return 'java';
      case 'cpp': return 'cpp';
      default: return 'javascript';
    }
  };

  if (!arena) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-950">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const isCreator = arena.createdBy._id === user?._id || arena.createdBy === user?._id;
  const participant = arena.participants?.find(
    p => (p.userId._id || p.userId) === user?._id
  );

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Fullscreen Warning */}
      {showFullscreenWarning && arena.status === 'waiting' && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          <div className="bg-slate-900 rounded-2xl p-8 max-w-md mx-4 border border-slate-800">
            <div className="text-center space-y-6">
              <AlertCircle className="w-16 h-16 text-orange-500 mx-auto" />
              <h2 className="text-2xl font-bold text-white">Fullscreen Required</h2>
              <p className="text-slate-400">
                You must enable fullscreen mode to participate in Friend Arena. Tab switching is monitored.
              </p>
              <button
                onClick={requestFullscreen}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold py-3 px-6 rounded-xl transition-all"
              >
                Enable Fullscreen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/friend-arena')}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-600 to-red-600">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Friend Arena</h1>
                <div className="text-xs text-slate-400">Room: {arena.roomCode}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {arena.status === 'active' && (
              <>
                <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-white font-semibold">{formatTime(timeRemaining)}</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg">
                  <Users className="w-4 h-4 text-green-500" />
                  <span className="text-white">{arena.participants?.length || 0}</span>
                </div>
                {isDisqualified && (
                  <div className="flex items-center gap-2 bg-rose-500/20 px-4 py-2 rounded-lg border border-rose-500/30">
                    <XCircle className="w-4 h-4 text-rose-500" />
                    <span className="text-rose-500 font-semibold">Disqualified</span>
                  </div>
                )}
                {tabSwitches > 0 && !isDisqualified && (
                  <div className="flex items-center gap-2 bg-amber-500/20 px-4 py-2 rounded-lg border border-amber-500/30">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span className="text-amber-500">Tab Switches: {tabSwitches}/1</span>
                  </div>
                )}
              </>
            )}
            {arena.status === 'waiting' && arena.participants?.length >= 2 && (
              <button
                onClick={handleStartContest}
                disabled={!isFullscreen}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Contest
              </button>
            )}
            {arena.status === 'active' && (
              <button
                onClick={handleEndContest}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 px-4 rounded-lg transition-all"
              >
                End Contest
              </button>
            )}
          </div>
        </div>
      </div>

      {arena.status === 'waiting' && (
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto bg-slate-900 rounded-2xl p-8 border border-slate-800">
            <h2 className="text-2xl font-bold text-white mb-6">Waiting Room</h2>
            <div className="space-y-4">
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-400">Room Code</span>
                  <span className="text-2xl font-bold text-white tracking-widest">{arena.roomCode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Topic</span>
                  <span className="text-white font-semibold capitalize">{arena.topic}</span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Participants ({arena.participants?.length || 0})</h3>
                <div className="space-y-2">
                  {arena.participants?.map((p, idx) => (
                    <div key={idx} className="bg-slate-800 rounded-lg p-4 flex items-center justify-between">
                      <span className="text-white">
                        {p.userId?.firstName || 'User'} {p.userId?.lastName || ''}
                      </span>
                      {isCreator && (p.userId._id === user?._id || p.userId === user?._id) && (
                        <span className="text-xs text-orange-500">(You - Creator)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {isCreator && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <p className="text-amber-400 text-sm">
                    You are the room creator. Start the contest when everyone is ready (minimum 2 participants required).
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {arena.status === 'active' && !isDisqualified && (
        <div className="flex h-[calc(100vh-73px)]">
          {/* Left Panel */}
          <div className="w-1/2 flex flex-col border-r border-slate-800">
            {/* Problem Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-900">
              {arena.problems?.map((problem, idx) => (
                <button
                  key={problem._id}
                  onClick={() => {
                    setSelectedProblem(problem);
                    const initialCode = problem.startCode?.find(
                      sc => sc.language === langMap[selectedLanguage]
                    )?.initialCode || '';
                    setCode(initialCode);
                    setActiveLeftTab('description');
                  }}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                    selectedProblem?._id === problem._id
                      ? 'text-orange-400 border-orange-400 bg-slate-800/50'
                      : 'text-slate-400 border-transparent hover:text-slate-300 hover:bg-slate-800/30'
                  }`}
                >
                  Problem {idx + 1}
                </button>
              ))}
            </div>

            {/* Left Content */}
            <div className="flex-1 overflow-y-auto bg-slate-900">
              <div className="p-6">
                {selectedProblem && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold text-white mb-3">{selectedProblem.title}</h1>
                      <div className="flex gap-2 mb-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                          {selectedProblem.difficulty}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                          {selectedProblem.tags}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Description
                      </h3>
                      <pre className="whitespace-pre-wrap font-sans leading-relaxed text-slate-300">
                        {selectedProblem.description}
                      </pre>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-500" />
                        Examples
                      </h3>
                      {selectedProblem.visibleTestCases?.map((example, idx) => (
                        <div key={idx} className="bg-slate-800 rounded-xl p-4 mb-4">
                          <h4 className="font-semibold mb-3 text-blue-400">Example {idx + 1}</h4>
                          <div className="space-y-2 text-sm font-mono">
                            <div className="text-slate-300">
                              <span className="font-semibold text-emerald-400">Input:</span> {example.input}
                            </div>
                            <div className="text-slate-300">
                              <span className="font-semibold text-blue-400">Output:</span> {example.output}
                            </div>
                            <div className="text-slate-400">
                              <span className="font-semibold">Explanation:</span> {example.explanation}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-1/2 flex flex-col bg-slate-900">
            {/* Right Tabs */}
            <div className="flex border-b border-slate-800">
              <button
                onClick={() => setActiveRightTab('code')}
                className={`px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                  activeRightTab === 'code'
                    ? 'text-purple-400 border-purple-400 bg-slate-800/50'
                    : 'text-slate-400 border-transparent hover:text-slate-300'
                }`}
              >
                Code
              </button>
              <button
                onClick={() => setActiveRightTab('testcase')}
                className={`px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                  activeRightTab === 'testcase'
                    ? 'text-purple-400 border-purple-400 bg-slate-800/50'
                    : 'text-slate-400 border-transparent hover:text-slate-300'
                }`}
              >
                Test Cases
              </button>
              <button
                onClick={() => setActiveRightTab('result')}
                className={`px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                  activeRightTab === 'result'
                    ? 'text-purple-400 border-purple-400 bg-slate-800/50'
                    : 'text-slate-400 border-transparent hover:text-slate-300'
                }`}
              >
                Result
              </button>
              <button
                onClick={() => setActiveRightTab('leaderboard')}
                className={`px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                  activeRightTab === 'leaderboard'
                    ? 'text-purple-400 border-purple-400 bg-slate-800/50'
                    : 'text-slate-400 border-transparent hover:text-slate-300'
                }`}
              >
                Leaderboard
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div className="flex gap-2">
                {['javascript', 'java', 'cpp'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setSelectedLanguage(lang);
                      if (selectedProblem) {
                        const initialCode = selectedProblem.startCode?.find(
                          sc => sc.language === langMap[lang]
                        )?.initialCode || '';
                        setCode(initialCode);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedLanguage === lang
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {lang === 'cpp' ? 'C++' : lang === 'javascript' ? 'JavaScript' : 'Java'}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRun}
                  disabled={running}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  {running ? 'Running...' : 'Run'}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || isDisqualified}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-500 hover:to-green-500 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>

            {/* Right Content */}
            <div className="flex-1 overflow-y-auto">
              {activeRightTab === 'code' && (
                <Editor
                  height="100%"
                  language={getLanguageForMonaco(selectedLanguage)}
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    wordWrap: 'on'
                  }}
                />
              )}

              {activeRightTab === 'testcase' && (
                <div className="p-6">
                  {runResult ? (
                    <div className="space-y-4">
                      {runResult.testCases?.map((tc, idx) => (
                        <div key={idx} className="bg-slate-800 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            {tc.status_id === 3 ? (
                              <CheckCircle className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-rose-500" />
                            )}
                            <span className="font-semibold text-white">Test Case {idx + 1}</span>
                          </div>
                          <div className="text-sm text-slate-300 space-y-1">
                            <div>Input: {tc.stdin}</div>
                            <div>Expected: {tc.expected_output}</div>
                            <div>Output: {tc.stdout || 'N/A'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      Click "Run" to test your code
                    </div>
                  )}
                </div>
              )}

              {activeRightTab === 'result' && (
                <div className="p-6">
                  {submitResult ? (
                    <div className={`rounded-xl border p-6 ${
                      submitResult.accepted
                        ? 'bg-emerald-900/20 border-emerald-700'
                        : 'bg-rose-900/20 border-rose-700'
                    }`}>
                      {submitResult.accepted ? (
                        <div className="text-center space-y-4">
                          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
                          <h3 className="text-2xl font-bold text-emerald-400">Accepted!</h3>
                          <p className="text-slate-300">
                            Test Cases: {submitResult.passedTestCases}/{submitResult.totalTestCases}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center space-y-4">
                          <XCircle className="w-16 h-16 text-rose-500 mx-auto" />
                          <h3 className="text-2xl font-bold text-rose-400">Wrong Answer</h3>
                          <p className="text-slate-300">
                            Test Cases: {submitResult.passedTestCases}/{submitResult.totalTestCases}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      Click "Submit" to submit your solution
                    </div>
                  )}
                </div>
              )}

              {activeRightTab === 'leaderboard' && (
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    Leaderboard
                  </h3>
                  <div className="space-y-3">
                    {leaderboard.map((entry, idx) => (
                      <div
                        key={entry.userId._id || entry.userId}
                        className={`bg-slate-800 rounded-lg p-4 flex items-center justify-between ${
                          (entry.userId._id || entry.userId) === user?._id
                            ? 'border-2 border-orange-500'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            idx === 0 ? 'bg-amber-500 text-white' :
                            idx === 1 ? 'bg-slate-600 text-white' :
                            idx === 2 ? 'bg-orange-800 text-white' :
                            'bg-slate-700 text-slate-300'
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <div className="text-white font-semibold">
                              {entry.userId?.firstName || 'User'} {entry.userId?.lastName || ''}
                              {(entry.userId._id || entry.userId) === user?._id && (
                                <span className="text-orange-500 ml-2">(You)</span>
                              )}
                            </div>
                            <div className="text-sm text-slate-400">
                              {entry.problemsSolved} problem{entry.problemsSolved !== 1 ? 's' : ''} solved
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-semibold">
                            {entry.totalTestCasesPassed} test cases
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {arena.status === 'ended' && (
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto bg-slate-900 rounded-2xl p-8 border border-slate-800">
            <h2 className="text-3xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
              <Trophy className="w-8 h-8 text-amber-500" />
              Final Leaderboard
            </h2>
            <div className="space-y-3">
              {leaderboard.map((entry, idx) => (
                <div
                  key={entry.userId._id || entry.userId}
                  className={`bg-slate-800 rounded-lg p-6 flex items-center justify-between ${
                    idx === 0 ? 'border-2 border-amber-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                      idx === 0 ? 'bg-amber-500 text-white' :
                      idx === 1 ? 'bg-slate-600 text-white' :
                      idx === 2 ? 'bg-orange-800 text-white' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {idx === 0 ? '🏆' : idx + 1}
                    </div>
                    <div>
                      <div className="text-white font-semibold text-lg">
                        {entry.userId?.firstName || 'User'} {entry.userId?.lastName || ''}
                      </div>
                      <div className="text-sm text-slate-400">
                        {entry.problemsSolved} problem{entry.problemsSolved !== 1 ? 's' : ''} solved
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold text-lg">
                      {entry.totalTestCasesPassed} test cases passed
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/friend-arena')}
              className="w-full mt-6 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold py-3 px-6 rounded-xl transition-all"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FriendArenaPage;

