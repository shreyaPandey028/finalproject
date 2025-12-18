import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import axiosClient from '../utils/axiosClient';
import { Clock, Trophy, Code2, CheckCircle, XCircle, Play, Send, AlertCircle, Users, ArrowLeft, FileText, Flag } from 'lucide-react';
import { useSelector } from 'react-redux';

const langMap = {
  cpp: 'C++',
  java: 'Java',
  javascript: 'JavaScript'
};

function ContestPage() {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [contest, setContest] = useState(null);
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
  const [joined, setJoined] = useState(false);
  const [contestEnded, setContestEnded] = useState(false);
  const [endingContest, setEndingContest] = useState(false);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [activeRightTab, setActiveRightTab] = useState('code');
  const socketRef = useRef(null);
  const editorRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const userEndTimeRef = useRef(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    fetchContest();
  }, [contestId]);

  useEffect(() => {
    if (!contestId || !user) return;

    // Initialize socket connection
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
      console.log('Connected to server');
      if (contestId && joined) {
        socketRef.current.emit('join-contest', contestId);
      }
    });

    socketRef.current.on('contest-data', (data) => {
      // Preserve full problem objects when updating from socket
      setContest(prevContest => {
        if (!prevContest || !data.contest) {
          return data.contest;
        }
        
        // If we have full problem objects, preserve them
        if (prevContest.problems && prevContest.problems.length > 0 && data.contest.problems) {
          const preservedProblems = data.contest.problems.map(socketProblem => {
            // Check if socketProblem is a full object or just an ID
            if (socketProblem && socketProblem.title) {
              // It's a full object, use it
              return socketProblem;
            } else {
              // It's just an ID, find the full object from previous contest
              const socketId = socketProblem?._id?.toString() || socketProblem?.toString();
              const fullProblem = prevContest.problems.find(p => {
                const pId = p._id?.toString() || p.toString();
                return pId === socketId;
              });
              return fullProblem || socketProblem;
            }
          });
          return { ...data.contest, problems: preservedProblems };
        }
        
        return data.contest;
      });
      
      if (data.contest.participants?.some(p => 
        (p.userId?._id === user?._id || p.userId === user?._id) && p.isActive
      )) {
        setJoined(true);
      }
      // Update leaderboard from socket data
      if (data.contest.leaderboard) {
        setLeaderboard(data.contest.leaderboard);
      }
    });

    socketRef.current.on('timer-update', (data) => {
      setTimeRemaining(data.remaining);
      if (data.endTime) {
        userEndTimeRef.current = new Date(data.endTime);
      }
    });

    socketRef.current.on('leaderboard-update', (updatedLeaderboard) => {
      if (updatedLeaderboard && updatedLeaderboard.length > 0) {
        setLeaderboard(updatedLeaderboard);
      }
    });

    socketRef.current.on('contest-status', (data) => {
      console.log('Contest status:', data);
    });

    socketRef.current.on('contest-ended', (data) => {
      alert(data.message);
      navigate('/contests');
    });

    socketRef.current.on('error', (error) => {
      setError(error.message);
    });

    return () => {
      if (socketRef.current) {
        if (contestId) {
          socketRef.current.emit('leave-contest', contestId);
        }
        socketRef.current.disconnect();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [contestId, user, joined]);

  useEffect(() => {
    if (selectedProblem && contest) {
      const initialCode = selectedProblem.startCode?.find(
        sc => sc.language === langMap[selectedLanguage]
      )?.initialCode || '';
      setCode(initialCode);
      setRunResult(null);
      setSubmitResult(null);
      setActiveRightTab('code');
    }
  }, [selectedProblem, selectedLanguage, contest]);

  const fetchContest = async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get(`/contest/${contestId}`);
      if (data.success) {
        setContest(data.contest);
        if (data.contest.problems?.length > 0) {
          setSelectedProblem(data.contest.problems[0]);
        }
        
        // Check if user has joined
        const participant = data.contest.participants?.find(p => 
          (p.userId?._id === user?._id || p.userId === user?._id)
        );
        if (participant) {
          setJoined(true);
          setContestEnded(!participant.isActive);
          const endTime = new Date(participant.endTime);
          userEndTimeRef.current = endTime;
          const now = new Date();
          setTimeRemaining(Math.max(0, endTime - now));
          
          // Start client-side timer update
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
              }
            }
          }, 1000);
        }
        
        // Fetch leaderboard
        if (data.contest.leaderboard) {
          setLeaderboard(data.contest.leaderboard);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch contest');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinContest = async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.post(`/contest/${contestId}/join`);
      if (data.success) {
        setJoined(true);
        setContest(data.contest);
        if (data.userStartTime && data.userEndTime) {
          const endTime = new Date(data.userEndTime);
          userEndTimeRef.current = endTime;
          const now = new Date();
          setTimeRemaining(Math.max(0, endTime - now));
          
          // Start client-side timer update
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
              }
            }
          }, 1000);
        }
        if (socketRef.current) {
          socketRef.current.emit('join-contest', contestId);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join contest');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    if (!selectedProblem) return;

    try {
      setRunning(true);
      setRunResult(null);
      setActiveRightTab('testcase');
      
      const response = await axiosClient.post(`/submission/run/${selectedProblem._id}`, {
        code,
        language: selectedLanguage
      });

      setRunResult(response.data);
    } catch (error) {
      console.error('Error running code:', error);
      setRunResult({
        success: false,
        error: 'Internal server error'
      });
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedProblem) return;

    try {
      setSubmitting(true);
      setSubmitResult(null);
      setActiveRightTab('result');
      
      const { data } = await axiosClient.post(
        `/contest/${contestId}/submit/${selectedProblem._id}`,
        {
          code,
          language: selectedLanguage
        }
      );

      setSubmitResult(data);
      if (data.success && data.contest) {
        // Update leaderboard from response
        if (data.contest.leaderboard) {
          setLeaderboard(data.contest.leaderboard);
        }
        // Leaderboard will also be updated via socket
        setTimeout(() => {
          setSubmitResult(null);
        }, 5000);
      }
    } catch (err) {
      setSubmitResult({
        success: false,
        message: err.response?.data?.message || 'Submission failed'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndContest = async () => {
    console.log('handleEndContest called');
    const confirmed = window.confirm('Are you sure you want to submit and end the contest? You will not be able to make any more submissions.');
    if (!confirmed) {
      console.log('User cancelled ending contest');
      return;
    }

    try {
      console.log('Ending contest...', contestId);
      setEndingContest(true);
      const { data } = await axiosClient.post(`/contest/${contestId}/end`);
      console.log('End contest response:', data);
      
      if (data.success) {
        setContestEnded(true);
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
        setTimeRemaining(0);
        
        // Update leaderboard
        if (data.leaderboard) {
          setLeaderboard(data.leaderboard);
        }
        
        // Update contest state to reflect ended status
        setContest(prevContest => {
          if (prevContest && prevContest.participants) {
            const updatedParticipants = prevContest.participants.map(p => {
              const pId = p.userId?._id?.toString() || p.userId?.toString();
              const uId = user?._id?.toString();
              if (pId === uId) {
                return { ...p, isActive: false };
              }
              return p;
            });
            return { ...prevContest, participants: updatedParticipants };
          }
          return prevContest;
        });
        
        // Show success message and switch to leaderboard tab
        alert('Contest ended successfully!');
        setActiveRightTab('leaderboard');
        // Fetch latest leaderboard
        try {
          const { data } = await axiosClient.get(`/contest/${contestId}/leaderboard`);
          if (data.success && data.leaderboard) {
            setLeaderboard(data.leaderboard);
          }
        } catch (err) {
          console.error('Error fetching leaderboard:', err);
        }
      } else {
        setError(data.message || 'Failed to end contest');
      }
    } catch (err) {
      console.error('Error ending contest:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to end contest';
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setEndingContest(false);
    }
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getUserStatus = (problemId) => {
    if (!user || !leaderboard.length) return null;
    const userEntry = leaderboard.find(l => {
      const userId = l.userId?._id || l.userId;
      const currentUserId = user._id;
      return userId?.toString() === currentUserId?.toString();
    });
    if (!userEntry || !userEntry.submissions) return null;
    
    // Convert problemId to string for comparison
    const problemIdStr = problemId?.toString();
    
    const submission = userEntry.submissions.find(s => {
      const subProblemId = s.problemId?._id || s.problemId;
      return subProblemId?.toString() === problemIdStr;
    });
    
    if (!submission) return null;
    return submission.solved ? 'solved' : submission.attempts > 0 ? 'attempted' : null;
  };

  if (loading && !contest) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="alert alert-error">
          <AlertCircle className="w-6 h-6" />
          <span>Contest not found</span>
        </div>
      </div>
    );
  }

  const now = new Date();
  const startTime = new Date(contest.startTime);
  const endTime = new Date(contest.endTime);
  const contestStarted = now >= startTime;
  const globalContestEnded = now > endTime;
  
  // Auto-switch to leaderboard tab if contest ended
  useEffect(() => {
    if ((contestEnded || globalContestEnded) && activeRightTab !== 'leaderboard' && leaderboard.length > 0) {
      setActiveRightTab('leaderboard');
    }
  }, [contestEnded, globalContestEnded, leaderboard.length]);

  if (!joined && !globalContestEnded) {
    return (
      <div className="min-h-screen bg-base-200 p-6">
        <div className="container mx-auto max-w-4xl">
          <button
            onClick={() => navigate('/contests')}
            className="btn btn-ghost mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Contests
          </button>
          
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body text-center">
              <h1 className="text-3xl font-bold mb-4">{contest.title}</h1>
              <p className="text-base-content/70 mb-6">{contest.description}</p>
              
              {!contestStarted ? (
                <div className="alert alert-info mb-6">
                  <Clock className="w-6 h-6" />
                  <span>Contest starts at {startTime.toLocaleString()}</span>
                </div>
              ) : (
                <>
                  <div className="alert alert-warning mb-6">
                    <Clock className="w-6 h-6" />
                    <span>Contest Duration: {contest.duration} minutes (1:30 hours)</span>
                  </div>
                  {error && (
                    <div className="alert alert-error mb-4">
                      <AlertCircle className="w-6 h-6" />
                      <span>{error}</span>
                    </div>
                  )}
                  <button
                    onClick={handleJoinContest}
                    className="btn btn-primary btn-lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Joining...
                      </>
                    ) : (
                      'Join Contest'
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Error Display */}
      {error && (
        <div className="alert alert-error mx-4 mt-4">
          <AlertCircle className="w-6 h-6" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="btn btn-sm btn-ghost">Close</button>
        </div>
      )}
      
      {/* Header */}
      <div className="navbar bg-base-100 shadow-lg px-4">
        <div className="flex-1">
          <button
            onClick={() => navigate('/contests')}
            className="btn btn-ghost btn-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <h1 className="text-xl font-bold ml-4">{contest.title}</h1>
        </div>
        <div className="flex items-center gap-4">
          {timeRemaining > 0 && !contestEnded && (
            <div className="flex items-center gap-2 badge badge-warning badge-lg">
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeRemaining)}</span>
            </div>
          )}
          {contestEnded && (
            <div className="flex items-center gap-2 badge badge-neutral badge-lg">
              <Flag className="w-4 h-4" />
              <span>Contest Ended</span>
            </div>
          )}
          {!contestEnded && joined && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('End Contest button clicked');
                handleEndContest();
              }}
              disabled={endingContest}
              className="btn btn-sm btn-error"
              type="button"
            >
              {endingContest ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Ending...
                </>
              ) : (
                <>
                  <Flag className="w-4 h-4 mr-2" />
                  End Contest
                </>
              )}
            </button>
          )}
          <button
            onClick={async () => {
              try {
                const { data } = await axiosClient.get(`/contest/${contestId}/leaderboard`);
                if (data.success) {
                  // Store leaderboard in sessionStorage for the leaderboard page
                  sessionStorage.setItem(`leaderboard-${contestId}`, JSON.stringify(data.leaderboard));
                  navigate(`/contests/${contestId}/leaderboard`);
                }
              } catch (err) {
                console.error('Error fetching leaderboard:', err);
                navigate(`/contests/${contestId}/leaderboard`);
              }
            }}
            className="btn btn-sm btn-ghost"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Leaderboard
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Problems Sidebar */}
        <div className="w-64 bg-base-100 border-r border-base-300 overflow-y-auto">
          <div className="p-4 border-b border-base-300 bg-base-200 sticky top-0 z-10">
            <h2 className="font-bold text-lg text-base-content">Problems</h2>
          </div>
          {contest.problems?.map((problem, index) => {
            const status = getUserStatus(problem._id);
            const problemId = problem._id?.toString() || problem.toString() || `problem-${index}`;
            return (
              <button
                key={problemId}
                onClick={() => setSelectedProblem(problem)}
                className={`w-full text-left p-4 border-b border-base-300 hover:bg-base-200 transition-colors ${
                  (selectedProblem?._id?.toString() === problem._id?.toString() || 
                   selectedProblem?._id?.toString() === problem.toString() ||
                   selectedProblem?.toString() === problem._id?.toString()) 
                   ? 'bg-base-200 border-l-4 border-l-primary' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-semibold">
                      {String.fromCharCode(65 + index)}. {problem.title || `Problem ${String.fromCharCode(65 + index)}`}
                    </div>
                    {problem.difficulty && (
                      <div className="text-sm text-base-content/70 mt-1">
                        {problem.difficulty}
                      </div>
                    )}
                  </div>
                  {status === 'solved' && (
                    <CheckCircle className="w-5 h-5 text-success" />
                  )}
                  {status === 'attempted' && (
                    <XCircle className="w-5 h-5 text-warning" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Main Content Area - Split into Left (Problem) and Right (Code/Test/Result) */}
        <div className="flex-1 flex">
          {/* Left Side - Problem Description */}
          <div className="w-1/2 flex flex-col border-r border-base-300">
            <div className="flex-1 overflow-y-auto p-6 bg-base-100">
              {selectedProblem ? (
                <>
                  <h2 className="text-2xl font-bold mb-4">{selectedProblem.title}</h2>
                  <div className="flex gap-2 mb-4">
                    <span className={`badge ${
                      selectedProblem.difficulty === 'easy' ? 'badge-success' :
                      selectedProblem.difficulty === 'medium' ? 'badge-warning' :
                      'badge-error'
                    }`}>
                      {selectedProblem.difficulty}
                    </span>
                    <span className="badge badge-outline">{selectedProblem.tags}</span>
                  </div>
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap text-base-content">{selectedProblem.description}</p>
                  </div>
                  
                  {/* Examples Section */}
                  {selectedProblem.visibleTestCases && selectedProblem.visibleTestCases.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Examples
                      </h3>
                      {selectedProblem.visibleTestCases.map((testCase, idx) => (
                        <div key={`testcase-${selectedProblem._id}-${idx}`} className="mb-4 p-4 bg-base-200 rounded-lg">
                          <p className="font-semibold mb-2">Example {idx + 1}:</p>
                          <div className="space-y-2">
                            <div>
                              <span className="font-medium">Input: </span>
                              <code className="bg-base-300 px-2 py-1 rounded">{testCase.input}</code>
                            </div>
                            <div>
                              <span className="font-medium">Output: </span>
                              <code className="bg-base-300 px-2 py-1 rounded">{testCase.output}</code>
                            </div>
                            {testCase.explanation && (
                              <div>
                                <span className="font-medium">Explanation: </span>
                                <span>{testCase.explanation}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xl">Select a problem to start coding</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Code Editor, Test Cases, Result */}
          <div className="w-1/2 flex flex-col bg-base-100">
            {/* Right Tabs */}
            <div className="flex border-b border-base-300 bg-base-200">
              <button
                onClick={() => setActiveRightTab('code')}
                className={`px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                  activeRightTab === 'code'
                    ? 'text-primary border-primary bg-base-100'
                    : 'text-base-content/70 border-transparent hover:text-base-content'
                }`}
              >
                <Code2 className="w-4 h-4 inline mr-2" />
                Code
              </button>
              <button
                onClick={() => setActiveRightTab('testcase')}
                className={`px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                  activeRightTab === 'testcase'
                    ? 'text-primary border-primary bg-base-100'
                    : 'text-base-content/70 border-transparent hover:text-base-content'
                }`}
              >
                <Play className="w-4 h-4 inline mr-2" />
                Test Cases
              </button>
              <button
                onClick={() => setActiveRightTab('result')}
                className={`px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                  activeRightTab === 'result'
                    ? 'text-primary border-primary bg-base-100'
                    : 'text-base-content/70 border-transparent hover:text-base-content'
                }`}
              >
                <Trophy className="w-4 h-4 inline mr-2" />
                Result
              </button>
              {(contestEnded || globalContestEnded) && (
                <button
                  onClick={() => setActiveRightTab('leaderboard')}
                  className={`px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                    activeRightTab === 'leaderboard'
                      ? 'text-primary border-primary bg-base-100'
                      : 'text-base-content/70 border-transparent hover:text-base-content'
                  }`}
                >
                  <Trophy className="w-4 h-4 inline mr-2" />
                  Leaderboard
                </button>
              )}
            </div>

            {/* Tab Content */}
            <div className="flex-1 flex flex-col">
              {activeRightTab === 'code' && (
                <>
                  {/* Language Selector and Buttons */}
                  <div className="flex items-center justify-between p-3 bg-base-200 border-b border-base-300">
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="select select-bordered select-sm"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={handleRun}
                        disabled={running || !code.trim() || contestEnded}
                        className="btn btn-sm btn-outline"
                      >
                        {running ? (
                          <>
                            <span className="loading loading-spinner loading-sm"></span>
                            Running...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Run
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={submitting || !code.trim() || running || contestEnded}
                        className="btn btn-sm btn-primary"
                      >
                        {submitting ? (
                          <>
                            <span className="loading loading-spinner loading-sm"></span>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Submit
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Code Editor */}
                  <div className="flex-1">
                    <Editor
                      height="100%"
                      language={selectedLanguage}
                      theme={darkMode ? 'vs-dark' : 'vs-light'}
                      value={code}
                      onChange={(value) => setCode(value || '')}
                      editorDidMount={(editor) => {
                        editorRef.current = editor;
                      }}
                    />
                  </div>
                </>
              )}

              {activeRightTab === 'testcase' && (
                <div className="flex-1 overflow-y-auto p-4">
                  {runResult ? (
                    <div className="space-y-4">
                      <div className={`alert ${runResult.success ? 'alert-success' : 'alert-error'}`}>
                        {runResult.success ? (
                          <>
                            <CheckCircle className="w-6 h-6" />
                            <span>All test cases passed!</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-6 h-6" />
                            <span>{runResult.error || 'Some test cases failed'}</span>
                          </>
                        )}
                      </div>

                      {runResult.testCases && (
                        <div className="space-y-3">
                          <h3 className="font-semibold">Test Case Results:</h3>
                          {runResult.testCases.map((test, idx) => (
                            <div key={`test-result-${selectedProblem._id}-${idx}-${test.stdin || idx}`} className={`p-3 rounded-lg border ${
                              test.status_id === 3 
                                ? 'bg-success/10 border-success' 
                                : 'bg-error/10 border-error'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">Test Case {idx + 1}</span>
                                {test.status_id === 3 ? (
                                  <CheckCircle className="w-5 h-5 text-success" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-error" />
                                )}
                              </div>
                              <div className="text-sm space-y-1">
                                <div>
                                  <span className="font-medium">Input: </span>
                                  <code className="bg-base-300 px-2 py-1 rounded text-xs">{test.stdin || 'N/A'}</code>
                                </div>
                                <div>
                                  <span className="font-medium">Expected: </span>
                                  <code className="bg-base-300 px-2 py-1 rounded text-xs">{test.expected_output || 'N/A'}</code>
                                </div>
                                <div>
                                  <span className="font-medium">Got: </span>
                                  <code className="bg-base-300 px-2 py-1 rounded text-xs">{test.stdout || 'N/A'}</code>
                                </div>
                                {test.stderr && (
                                  <div className="text-error text-xs mt-1">
                                    <span className="font-medium">Error: </span>
                                    {test.stderr}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {runResult.runtime !== undefined && (
                        <div className="text-sm text-base-content/70">
                          <p>Runtime: {runResult.runtime.toFixed(2)}s</p>
                          <p>Memory: {runResult.memory}KB</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Play className="w-12 h-12 mx-auto mb-4 text-base-content/30" />
                        <p className="text-base-content/70">Click "Run" to test your code against visible test cases</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeRightTab === 'result' && (
                <div className="flex-1 overflow-y-auto p-4">
                  {submitResult ? (
                    <div className={`alert ${submitResult.success ? 'alert-success' : 'alert-error'} shadow-lg`}>
                      {submitResult.success ? (
                        <>
                          <CheckCircle className="w-6 h-6" />
                          <div>
                            <h3 className="font-bold">Accepted!</h3>
                            <p>Problem solved successfully. Your submission has been recorded.</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-6 h-6" />
                          <div>
                            <h3 className="font-bold">Wrong Answer</h3>
                            <p>{submitResult.message || 'Your solution did not pass all test cases.'}</p>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Trophy className="w-12 h-12 mx-auto mb-4 text-base-content/30" />
                        <p className="text-base-content/70">Click "Submit" to submit your solution for evaluation</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeRightTab === 'leaderboard' && (
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Trophy className="w-6 h-6 text-warning" />
                      Final Leaderboard
                    </h2>
                    <p className="text-base-content/70 mt-1">Contest has ended. Here are the final results.</p>
                  </div>
                  {leaderboard && leaderboard.length > 0 ? (
                    <div className="space-y-3">
                      {leaderboard.map((entry, idx) => {
                        const userId = entry.userId?._id || entry.userId;
                        const isCurrentUser = userId?.toString() === user?._id?.toString();
                        return (
                          <div
                            key={userId || idx}
                            className={`card bg-base-100 shadow-md ${
                              isCurrentUser ? 'ring-2 ring-primary' : ''
                            } ${
                              idx === 0 ? 'bg-warning/10 border-2 border-warning' :
                              idx === 1 ? 'bg-base-300/50 border-2 border-base-300' :
                              idx === 2 ? 'bg-warning/5 border-2 border-warning/30' :
                              'border border-base-300'
                            }`}
                          >
                            <div className="card-body p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                                    idx === 0 ? 'bg-warning text-warning-content' :
                                    idx === 1 ? 'bg-base-300 text-base-content' :
                                    idx === 2 ? 'bg-warning/30 text-warning-content' :
                                    'bg-base-200 text-base-content'
                                  }`}>
                                    {idx === 0 ? '🏆' : idx + 1}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-lg">
                                      {entry.userId?.firstName || 'User'} {entry.userId?.lastName || ''}
                                      {isCurrentUser && (
                                        <span className="badge badge-primary badge-sm ml-2">You</span>
                                      )}
                                    </div>
                                    <div className="text-sm text-base-content/70">
                                      {entry.problemsSolved} problem{entry.problemsSolved !== 1 ? 's' : ''} solved
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold">
                                    Score: {entry.totalScore}
                                  </div>
                                  <div className="text-sm text-base-content/70">
                                    {entry.submissions?.filter(s => s.solved).length || 0} accepted
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Trophy className="w-12 h-12 mx-auto mb-4 text-base-content/30" />
                        <p className="text-base-content/70">No leaderboard data available yet</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContestPage;
