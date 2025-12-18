import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import Editor from '@monaco-editor/react';
import { Sun, Moon, Play, Send, Code2, FileText, Check, X, Clock, Cpu, Trophy, Zap, Flame } from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import StreakBadgePopup from '../components/StreakBadgePopup';

const langMap = {
  cpp: 'C++',
  java: 'Java',
  javascript: 'JavaScript'
};

const DailyChallengePage = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [problem, setProblem] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [activeRightTab, setActiveRightTab] = useState('code');
  const [userStreak, setUserStreak] = useState({ currentStreak: 0, longestStreak: 0, completedToday: false });
  const [dayNumber, setDayNumber] = useState(1);
  const [showBadgePopup, setShowBadgePopup] = useState(false);
  const editorRef = useRef(null);

  const { handleSubmit } = useForm();

  useEffect(() => {
    fetchDailyChallenge();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (problem) {
      const initialCode = problem.startCode.find(sc => sc.language === langMap[selectedLanguage])?.initialCode || '';
      setCode(initialCode);
    }
  }, [selectedLanguage, problem]);

  const fetchDailyChallenge = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/daily-challenge/today');
      setProblem(response.data.challenge);
      setDayNumber(response.data.dayNumber);
      setUserStreak(response.data.userStreak);
      
      const initialCode = response.data.challenge.startCode.find(sc => sc.language === langMap[selectedLanguage])?.initialCode || '';
      setCode(initialCode);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching daily challenge:', error);
      setLoading(false);
    }
  };

  const handleEditorChange = (value) => {
    setCode(value || '');
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
  };

  const handleRun = async () => {
    setLoading(true);
    setRunResult(null);
    
    try {
      const response = await axiosClient.post('/daily-challenge/run', {
        code,
        language: selectedLanguage
      });

      setRunResult(response.data);
      setLoading(false);
      setActiveRightTab('testcase');
    } catch (error) {
      console.error('Error running code:', error);
      setRunResult({
        success: false,
        error: 'Internal server error'
      });
      setLoading(false);
      setActiveRightTab('testcase');
    }
  };

  const handleSubmitCode = async () => {
    setLoading(true);
    setSubmitResult(null);
    
    try {
      const response = await axiosClient.post('/daily-challenge/submit', {
        code: code,
        language: selectedLanguage
      });

      setSubmitResult(response.data);
      
      if (response.data.accepted) {
        // Update streak info
        const streakResponse = await axiosClient.get('/daily-challenge/streak');
        setUserStreak({
          currentStreak: streakResponse.data.currentStreak,
          longestStreak: streakResponse.data.longestStreak,
          completedToday: true
        });
        
        // Show badge popup
        setShowBadgePopup(true);
      }
      
      setLoading(false);
      setActiveRightTab('result');
    } catch (error) {
      console.error('Error submitting code:', error);
      setSubmitResult(null);
      setLoading(false);
      setActiveRightTab('result');
    }
  };

  const getLanguageForMonaco = (lang) => {
    switch (lang) {
      case 'javascript': return 'javascript';
      case 'java': return 'java';
      case 'cpp': return 'cpp';
      default: return 'javascript';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'medium': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'hard': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  if (loading && !problem) {
    return (
      <div className={`flex justify-center items-center min-h-screen ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="relative">
          <div className={`w-12 h-12 border-4 ${darkMode ? 'border-slate-700' : 'border-slate-300'} rounded-full animate-spin border-t-transparent`}></div>
          <div className={`absolute inset-0 flex items-center justify-center text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
      {/* Badge Popup */}
      <StreakBadgePopup
        isOpen={showBadgePopup}
        onClose={() => setShowBadgePopup(false)}
        dayNumber={dayNumber}
        currentStreak={userStreak.currentStreak}
      />

      {/* Header */}
      <div className={`border-b ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} transition-colors`}>
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg ${darkMode ? 'bg-gradient-to-br from-orange-600 to-red-600' : 'bg-gradient-to-br from-orange-500 to-red-500'}`}>
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Daily Challenge
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                  darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700'
                }`}>
                  <Flame className="w-3 h-3" />
                  Day {dayNumber}
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                  darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                }`}>
                  <Trophy className="w-3 h-3" />
                  Streak: {userStreak.currentStreak} days
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2.5 rounded-xl transition-all duration-300 ${
              darkMode 
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-400' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Panel */}
        <div className={`w-1/2 flex flex-col border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'} transition-colors`}>
          {/* Left Content */}
          <div className={`flex-1 overflow-y-auto ${darkMode ? 'bg-slate-900' : 'bg-white'} transition-colors`}>
            <div className="p-6">
              {problem && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {problem.title}
                      </h1>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(problem.difficulty)}`}>
                          {problem.difficulty?.charAt(0).toUpperCase() + problem.difficulty?.slice(1)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {problem.tags}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`prose max-w-none ${darkMode ? 'prose-invert' : ''}`}>
                    <pre className={`whitespace-pre-wrap font-sans leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {problem.description}
                    </pre>
                  </div>

                  <div className="space-y-4">
                    <h3 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      <Zap className="w-5 h-5 text-amber-500" />
                      Examples
                    </h3>
                    {problem.visibleTestCases?.map((example, index) => (
                      <div
                        key={index}
                        className={`rounded-xl border p-4 transition-all duration-200 ${
                          darkMode
                            ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <h4 className={`font-semibold mb-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          Example {index + 1}
                        </h4>
                        <div className="space-y-2 text-sm font-mono">
                          <div className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                            <span className={`font-semibold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Input:</span> {example.input}
                          </div>
                          <div className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                            <span className={`font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Output:</span> {example.output}
                          </div>
                          <div className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
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
        <div className={`w-1/2 flex flex-col ${darkMode ? 'bg-slate-900' : 'bg-white'} transition-colors`}>
          {/* Right Header with Tabs and Action Buttons */}
          <div className={`flex items-center justify-between border-b ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} transition-colors`}>
            {/* Right Tabs */}
            <div className="flex">
              <button
                onClick={() => setActiveRightTab('code')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                  activeRightTab === 'code'
                    ? darkMode
                      ? 'text-purple-400 border-purple-400 bg-slate-800/50'
                      : 'text-purple-600 border-purple-600 bg-purple-50'
                    : darkMode
                      ? 'text-slate-400 border-transparent hover:text-slate-300 hover:bg-slate-800/30'
                      : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Code2 className="w-4 h-4" />
                Code
              </button>
              <button
                onClick={() => setActiveRightTab('testcase')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                  activeRightTab === 'testcase'
                    ? darkMode
                      ? 'text-purple-400 border-purple-400 bg-slate-800/50'
                      : 'text-purple-600 border-purple-600 bg-purple-50'
                    : darkMode
                      ? 'text-slate-400 border-transparent hover:text-slate-300 hover:bg-slate-800/30'
                      : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Play className="w-4 h-4" />
                Test Cases
              </button>
              <button
                onClick={() => setActiveRightTab('result')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                  activeRightTab === 'result'
                    ? darkMode
                      ? 'text-purple-400 border-purple-400 bg-slate-800/50'
                      : 'text-purple-600 border-purple-600 bg-purple-50'
                    : darkMode
                      ? 'text-slate-400 border-transparent hover:text-slate-300 hover:bg-slate-800/30'
                      : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Trophy className="w-4 h-4" />
                Result
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 px-4">
              <button
                onClick={handleRun}
                disabled={loading && activeRightTab !== 'result'}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  darkMode
                    ? 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
                    : 'bg-white text-slate-900 hover:bg-slate-50 border border-slate-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Play className="w-4 h-4" />
                {loading && activeRightTab === 'testcase' ? 'Running...' : 'Run'}
              </button>
              <button
                onClick={handleSubmitCode}
                disabled={loading && activeRightTab === 'result' || userStreak.completedToday}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 shadow-lg ${
                  userStreak.completedToday
                    ? 'bg-gray-500 cursor-not-allowed'
                    : darkMode
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 shadow-emerald-500/30'
                      : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-emerald-500/30'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Send className="w-4 h-4" />
                {userStreak.completedToday ? 'Completed' : loading && activeRightTab === 'result' ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>

          {/* Right Content */}
          <div className="flex-1 flex flex-col">
            {activeRightTab === 'code' && (
              <div className="flex-1 flex flex-col animate-in fade-in duration-300">
                {/* Language Selector */}
                <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                  <div className="flex gap-2">
                    {['javascript', 'java', 'cpp'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => handleLanguageChange(lang)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          selectedLanguage === lang
                            ? darkMode
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/30'
                              : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-purple-500/30'
                            : darkMode
                              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {lang === 'cpp' ? 'C++' : lang === 'javascript' ? 'JavaScript' : 'Java'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Monaco Editor */}
                <div className="flex-1">
                  <Editor
                    height="100%"
                    language={getLanguageForMonaco(selectedLanguage)}
                    value={code}
                    onChange={handleEditorChange}
                    onMount={handleEditorDidMount}
                    theme={darkMode ? "vs-dark" : "light"}
                    options={{
                      fontSize: 14,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      insertSpaces: true,
                      wordWrap: 'on',
                      lineNumbers: 'on',
                      glyphMargin: false,
                      folding: true,
                      lineDecorationsWidth: 10,
                      lineNumbersMinChars: 3,
                      renderLineHighlight: 'line',
                      selectOnLineNumbers: true,
                      roundedSelection: false,
                      readOnly: false,
                      cursorStyle: 'line',
                      mouseWheelZoom: true,
                    }}
                  />
                </div>
              </div>
            )}

            {activeRightTab === 'testcase' && (
              <div className="flex-1 p-6 overflow-y-auto animate-in fade-in duration-300">
                <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  <Play className="w-5 h-5" />
                  Test Results
                </h3>
                {runResult ? (
                  <div className={`rounded-xl border p-6 ${
                    runResult.success
                      ? darkMode ? 'bg-emerald-900/20 border-emerald-700' : 'bg-emerald-50 border-emerald-200'
                      : darkMode ? 'bg-rose-900/20 border-rose-700' : 'bg-rose-50 border-rose-200'
                  }`}>
                    {runResult.success ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Check className="w-6 h-6 text-emerald-500" />
                          <h4 className={`text-lg font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                            All test cases passed!
                          </h4>
                        </div>
                        {runResult.runtime && runResult.memory && (
                          <div className="flex gap-6">
                            <div className={`flex items-center gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                              <Clock className="w-4 h-4" />
                              <span className="text-sm">Runtime: <strong>{runResult.runtime} sec</strong></span>
                            </div>
                            <div className={`flex items-center gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                              <Cpu className="w-4 h-4" />
                              <span className="text-sm">Memory: <strong>{runResult.memory} KB</strong></span>
                            </div>
                          </div>
                        )}
                        <div className="space-y-3 mt-4">
                          {runResult.testCases?.map((tc, i) => (
                            <div key={i} className={`p-4 rounded-lg ${darkMode ? 'bg-slate-800/50 border border-slate-700' : 'bg-white border border-slate-200'}`}>
                              <div className="space-y-2 text-sm font-mono">
                                <div className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                                  <span className="font-semibold">Input:</span> {tc.stdin}
                                </div>
                                <div className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                                  <span className="font-semibold">Expected:</span> {tc.expected_output}
                                </div>
                                <div className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                                  <span className="font-semibold">Output:</span> {tc.stdout}
                                </div>
                                <div className="flex items-center gap-2 text-emerald-500 font-semibold">
                                  <Check className="w-4 h-4" />
                                  Passed
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <X className="w-6 h-6 text-rose-500" />
                          <h4 className={`text-lg font-bold ${darkMode ? 'text-rose-400' : 'text-rose-700'}`}>
                            {runResult.error || 'Tests Failed'}
                          </h4>
                        </div>
                        <div className="space-y-3">
                          {runResult.testCases?.map((tc, i) => (
                            <div key={i} className={`p-4 rounded-lg ${darkMode ? 'bg-slate-800/50 border border-slate-700' : 'bg-white border border-slate-200'}`}>
                              <div className="space-y-2 text-sm font-mono">
                                <div className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                                  <span className="font-semibold">Input:</span> {tc.stdin}
                                </div>
                                <div className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                                  <span className="font-semibold">Expected:</span> {tc.expected_output}
                                </div>
                                <div className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                                  <span className="font-semibold">Output:</span> {tc.stdout}
                                </div>
                                <div className={`flex items-center gap-2 font-semibold ${tc.status_id === 3 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {tc.status_id === 3 ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                  {tc.status_id === 3 ? 'Passed' : 'Failed'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`text-center py-12 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    <Play className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Click "Run" to test your code with example test cases</p>
                  </div>
                )}
              </div>
            )}

            {activeRightTab === 'result' && (
              <div className="flex-1 p-6 overflow-y-auto animate-in fade-in duration-300">
                <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  <Trophy className="w-5 h-5" />
                  Submission Result
                </h3>
                {submitResult ? (
                  <div className={`rounded-xl border p-8 ${
                    submitResult.accepted
                      ? darkMode ? 'bg-emerald-900/20 border-emerald-700' : 'bg-emerald-50 border-emerald-200'
                      : darkMode ? 'bg-rose-900/20 border-rose-700' : 'bg-rose-50 border-rose-200'
                  }`}>
                    {submitResult.accepted ? (
                      <div className="space-y-6 text-center">
                        <div>
                          <Trophy className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                          <h4 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                            🎉 Accepted!
                          </h4>
                          <p className={darkMode ? 'text-slate-300' : 'text-slate-600'}>
                            Congratulations! Your solution passed all test cases.
                          </p>
                        </div>
                        <div className={`grid grid-cols-2 gap-4 pt-6 border-t ${darkMode ? 'border-emerald-700/30' : 'border-emerald-200'}`}>
                          <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-800/50' : 'bg-white'}`}>
                            <div className={`text-sm mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Test Cases</div>
                            <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                              {submitResult.passedTestCases}/{submitResult.totalTestCases}
                            </div>
                          </div>
                          <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-800/50' : 'bg-white'}`}>
                            <div className={`text-sm mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Runtime</div>
                            <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                              {submitResult.runtime} sec
                            </div>
                          </div>
                          <div className={`p-4 rounded-lg col-span-2 ${darkMode ? 'bg-slate-800/50' : 'bg-white'}`}>
                            <div className={`text-sm mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Memory</div>
                            <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                              {submitResult.memory} KB
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6 text-center">
                        <div>
                          <X className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-rose-400' : 'text-rose-600'}`} />
                          <h4 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-rose-400' : 'text-rose-700'}`}>
                            ❌ {submitResult.error || 'Submission Failed'}
                          </h4>
                          <p className={darkMode ? 'text-slate-300' : 'text-slate-600'}>
                            Your solution needs improvement. Check the details below.
                          </p>
                        </div>
                        <div className={`grid grid-cols-2 gap-4 pt-6 border-t ${darkMode ? 'border-rose-700/30' : 'border-rose-200'}`}>
                          <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-800/50' : 'bg-white'}`}>
                            <div className={`text-sm mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Test Cases</div>
                            <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                              {submitResult.passedTestCases}/{submitResult.totalTestCases}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`text-center py-12 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Click "Submit" to submit your solution for evaluation</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default DailyChallengePage;

