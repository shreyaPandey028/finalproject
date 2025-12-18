import { useState, useEffect, useRef } from 'react';
import axiosClient from '../utils/axiosClient';

// Simple delay function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Request tracking
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1500; // 1.5 seconds

const ComplexityAnalyzer = ({ code, language, problem }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);

  const analyzeComplexity = async () => {
    if (!code || code.trim() === '') {
      setError('Please write some code first');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Ensure minimum interval between requests
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        const delayNeeded = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        await delay(delayNeeded);
      }
      
      // Update last request time
      lastRequestTime = Date.now();
      
      // Call the backend API to analyze complexity
      const response = await axiosClient.post('/complexity/analyze', {
        code,
        language,
        problem
      });
      
      // Check if we got an error response
      if (response.status >= 400) {
        const errorMessage = response.data?.message || 'An error occurred while analyzing complexity';
        if (response.status === 429) {
          const retryMessage = response.data.retryAfter ? ` Please try again in ${response.data.retryAfter}.` : '';
          setError(`Rate limit exceeded. ${errorMessage}${retryMessage}`);
        } else {
          setError(`Error: ${errorMessage}`);
        }
        setLoading(false);
        return;
      }
      
      // Generate mock performance data based on the analysis
      const testData = generatePerformanceData(response.data.timeComplexity);
      
      setAnalysis({
        ...response.data,
        testData
      });
      
      drawGraph(testData);
      setLoading(false);
    } catch (err) {
      // Handle network errors or other exceptions
      if (err.response?.status === 429) {
        const retryMessage = err.response.data.retryAfter ? ` Please check your quota at ${err.response.data.retryAfter}.` : '';
        setError(`Rate limit exceeded. ${err.response.data.message}${retryMessage}`);
      } else {
        setError('Failed to analyze complexity: ' + (err.response?.data?.message || err.message));
      }
      setLoading(false);
    }
  };

  // Function to generate mock performance data for graph visualization
  const generatePerformanceData = (timeComplexity) => {
    // This would be replaced with actual benchmarking in a real implementation
    const testData = [];
    
    // Generate mock data based on complexity pattern
    const patterns = {
      'O(1)': () => 1,
      'O(log n)': (n) => Math.log2(n) * 10,
      'O(n)': (n) => n * 0.5,
      'O(n log n)': (n) => n * Math.log2(n) * 0.1,
      'O(n^2)': (n) => n * n * 0.01,
      'O(2^n)': (n) => Math.pow(2, n) * 0.001,
      'default': (n) => n
    };
    
    // Extract the complexity notation (e.g., O(n) from "O(n) - Linear")
    const cleanComplexity = timeComplexity?.split(' ')[0] || 'O(n)';
    const pattern = patterns[cleanComplexity] || patterns['default'];
    
    // Generate data points
    for (let i = 1; i <= 10; i++) {
      const inputSize = i * 100;
      const executionTime = Math.max(0.1, pattern(inputSize) + (Math.random() * 10)); // Add some randomness
      testData.push({
        inputSize,
        executionTime: parseFloat(executionTime.toFixed(2))
      });
    }
    
    return testData;
  };

  const drawGraph = (data) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    
    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = 50 + (i * (width - 100) / 10);
      ctx.beginPath();
      ctx.moveTo(x, 30);
      ctx.lineTo(x, height - 30);
      ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let i = 0; i <= 10; i++) {
      const y = 30 + (i * (height - 60) / 10);
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(width - 50, y);
      ctx.stroke();
    }
    
    // Draw axes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(50, height - 30);
    ctx.lineTo(width - 50, height - 30);
    ctx.stroke();
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(50, 30);
    ctx.lineTo(50, height - 30);
    ctx.stroke();
    
    // Draw axis labels
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    // X-axis labels
    for (let i = 0; i <= 10; i++) {
      const x = 50 + (i * (width - 100) / 10);
      const value = Math.round((data[data.length - 1].inputSize / 10) * i);
      ctx.fillText(value.toString(), x, height - 10);
    }
    
    // Y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 10; i++) {
      const y = 30 + (i * (height - 60) / 10);
      const maxValue = Math.max(...data.map(d => d.executionTime));
      const value = Math.round(maxValue - (maxValue / 10) * i);
      ctx.fillText(value.toString(), 40, y + 4);
    }
    
    // Draw axis titles
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('Input Size (n)', width / 2, height - 5);
    
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Execution Time (ms)', 0, 0);
    ctx.restore();
    
    // Draw data points and line
    if (data && data.length > 0) {
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 3;
      ctx.beginPath();
      
      const maxValue = Math.max(...data.map(d => d.executionTime));
      const maxInput = Math.max(...data.map(d => d.inputSize));
      
      data.forEach((point, index) => {
        const x = 50 + (point.inputSize / maxInput) * (width - 100);
        const y = 30 + (height - 60) - (point.executionTime / maxValue) * (height - 60);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      // Draw data points
      ctx.fillStyle = '#3b82f6';
      data.forEach(point => {
        const x = 50 + (point.inputSize / maxInput) * (width - 100);
        const y = 30 + (height - 60) - (point.executionTime / maxValue) * (height - 60);
        
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  };

  useEffect(() => {
    if (analysis && canvasRef.current) {
      drawGraph(analysis.testData);
    }
  }, [analysis]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Complexity Analyzer</h2>
        <button
          onClick={analyzeComplexity}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Analyzing...
            </>
          ) : (
            'Analyze Complexity'
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {analysis ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">Time Complexity</h3>
              <div className="text-2xl font-bold text-blue-400">{analysis.timeComplexity}</div>
              <p className="text-slate-400 mt-2">{analysis.explanation}</p>
            </div>
            
            <div className="bg-slate-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">Space Complexity</h3>
              <div className="text-2xl font-bold text-green-400">{analysis.spaceComplexity}</div>
              <p className="text-slate-400 mt-2">Memory usage based on input size</p>
            </div>
          </div>

          {analysis.breakdown && analysis.breakdown.length > 0 && (
            <div className="bg-slate-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Detailed Breakdown</h3>
              <div className="space-y-3">
                {analysis.breakdown.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded">
                    <div>
                      <div className="font-medium text-white">{item.operation}</div>
                      <div className="text-sm text-slate-400">{item.description}</div>
                    </div>
                    <div className="font-mono text-lg font-bold text-amber-400">{item.complexity}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Performance Graph</h3>
            <div className="bg-slate-900 p-4 rounded">
              <canvas 
                ref={canvasRef} 
                width={600} 
                height={300}
                className="w-full"
              />
            </div>
            <div className="mt-3 text-sm text-slate-400">
              Execution time vs input size analysis
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-block p-4 bg-slate-800 rounded-full mb-4">
            <Cpu className="w-12 h-12 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Ready to Analyze</h3>
          <p className="text-slate-400 max-w-md mx-auto">
            Click the "Analyze Complexity" button to evaluate the time and space complexity of your code.
          </p>
        </div>
      )}
    </div>
  );
};

// Simple CPU icon component since we're not importing it
const Cpu = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" strokeWidth="2" />
    <line x1="15" y1="1" x2="15" y2="4" strokeWidth="2" />
    <line x1="9" y1="20" x2="9" y2="23" strokeWidth="2" />
    <line x1="15" y1="20" x2="15" y2="23" strokeWidth="2" />
    <line x1="20" y1="9" x2="23" y2="9" strokeWidth="2" />
    <line x1="20" y1="14" x2="23" y2="14" strokeWidth="2" />
    <line x1="1" y1="9" x2="4" y2="9" strokeWidth="2" />
    <line x1="1" y1="14" x2="4" y2="14" strokeWidth="2" />
  </svg>
);

export default ComplexityAnalyzer;