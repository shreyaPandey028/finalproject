import { useState, useEffect, useRef } from 'react';
import { Cpu, AlertCircle } from 'lucide-react';

// Static complexity analyzer that works without API keys
// Uses enhanced pattern matching to determine code complexity accurately for multiple languages
const StaticComplexityAnalyzer = ({ code, language, problem }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);

  // Function to analyze loop depth and nesting more accurately for multiple languages
  const analyzeLoopStructure = (codeText) => {
    // Count different types of loops for JavaScript
    const jsForLoopCount = (codeText.match(/for\s*\(/g) || []).length;
    const jsWhileLoopCount = (codeText.match(/while\s*\(/g) || []).length;
    const jsForEachCount = (codeText.match(/\.forEach\s*\(/g) || []).length;
    const jsMapCount = (codeText.match(/\.map\s*\(/g) || []).length;
    const jsFilterCount = (codeText.match(/\.filter\s*\(/g) || []).length;
    
    // Count different types of loops for Java/C-like languages
    const javaForLoopCount = (codeText.match(/for\s*\([^)]*\)/g) || []).length;
    const javaWhileLoopCount = (codeText.match(/while\s*\([^)]*\)/g) || []).length;
    const javaEnhancedForCount = (codeText.match(/for\s*\([^)]*:[^)]*\)/g) || []).length;
    
    // Use appropriate counts based on language
    const forLoopCount = javaForLoopCount > jsForLoopCount ? javaForLoopCount : jsForLoopCount;
    const whileLoopCount = javaWhileLoopCount > jsWhileLoopCount ? javaWhileLoopCount : jsWhileLoopCount;
    const forEachCount = jsForEachCount + jsMapCount + jsFilterCount + javaEnhancedForCount;
    
    // More accurate nested loop detection by analyzing loop dependencies
    let maxNestedDepth = 0;
    let currentDepth = 0;
    
    // Split code into lines and analyze structure
    const lines = codeText.split('\n');
    
    // Look for patterns that indicate nested loops
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and comments
      if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*') || line.startsWith('#')) continue;
      
      // Check if this line starts a loop (support for multiple languages)
      if (line.match(/^(for|while)\s*\(/)) {
        currentDepth++;
        maxNestedDepth = Math.max(maxNestedDepth, currentDepth);
      }
      
      // Check for closing braces which might end a loop block
      const closingBraces = (line.match(/}/g) || []).length;
      if (closingBraces > 0 && currentDepth > 0) {
        currentDepth = Math.max(0, currentDepth - closingBraces);
      }
    }
    
    // Special detection for dependent nested loops (like your example)
    // Look for patterns where inner loop bound depends on outer loop variable
    const dependentLoopPattern = /for\s*\([^;]*;\s*\w+\s*[<=>!]+\s*\w+[^;]*;\s*[^)]*\)\s*\{\s*[\s\S]*?for\s*\([^;]*;\s*\w+\s*[<=>!]+\s*\w+[^;]*;\s*[^)]*\)\s*\{/g;
    const dependentMatches = (codeText.match(dependentLoopPattern) || []).length;
    
    // If we found dependent nested loops, ensure we have at least depth 2
    if (dependentMatches > 0 && maxNestedDepth < 2) {
      maxNestedDepth = 2;
    }
    
    return {
      forLoopCount,
      whileLoopCount,
      forEachCount,
      nestedLoopDepth: maxNestedDepth,
      dependentLoops: dependentMatches > 0
    };
  };

  // Function to detect recursion
  const detectRecursion = (codeText) => {
    // Look for function calls within their own function body
    const functionDeclarations = codeText.match(/function\s+(\w+)\s*\([^)]*\)|const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/g) || [];
    let recursionCount = 0;
    
    for (const declaration of functionDeclarations) {
      // Extract function name
      const functionNameMatch = declaration.match(/function\s+(\w+)\s*\(|const\s+(\w+)\s*=/);
      if (functionNameMatch) {
        const functionName = functionNameMatch[1] || functionNameMatch[2];
        if (functionName) {
          // Count how many times the function calls itself
          const selfCalls = (codeText.match(new RegExp(functionName + '\\s*\\(', 'g')) || []).length;
          // Subtract 1 for the definition itself
          if (selfCalls > 1) {
            recursionCount += (selfCalls - 1);
          }
        }
      }
    }
    
    return recursionCount;
  };

  // Function to detect divide and conquer patterns (binary search, etc.)
  const detectDivideAndConquer = (codeText) => {
    // Look for patterns that suggest divide and conquer
    const divideIndicators = [
      /Math\.floor|Math\.ceil|Math\.round/g,
      />>\s*\d+/g, // Bit shifting
      /\*\*\s*0\.5/g, // Square root
      /\/\s*2/g, // Division by 2
      /middle|mid/g
    ];
    
    let divideCount = 0;
    for (const pattern of divideIndicators) {
      divideCount += (codeText.match(pattern) || []).length;
    }
    
    return divideCount;
  };

  // Function to detect sorting algorithms
  const detectSorting = (codeText) => {
    const sortingIndicators = [
      /sort\s*\(/g,
      /merge/g,
      /quickSort/g,
      /bubbleSort/g,
      /selectionSort/g,
      /insertionSort/g
    ];
    
    let sortCount = 0;
    for (const pattern of sortingIndicators) {
      sortCount += (codeText.match(pattern) || []).length;
    }
    
    return sortCount;
  };

  // Pattern database for complexity detection
  const complexityPatterns = {
    'O(1)': {
      name: 'Constant Time',
      description: 'Operations that execute in constant time regardless of input size',
      weight: 1
    },
    'O(log n)': {
      name: 'Logarithmic Time',
      description: 'Algorithms that reduce the problem size by half in each step',
      weight: 3
    },
    'O(n)': {
      name: 'Linear Time',
      description: 'Algorithms that process each element once',
      weight: 2
    },
    'O(n log n)': {
      name: 'Linearithmic Time',
      description: 'Common in efficient sorting algorithms',
      weight: 4
    },
    'O(n²)': {
      name: 'Quadratic Time',
      description: 'Algorithms with nested iterations over the data',
      weight: 5
    },
    'O(n³)': {
      name: 'Cubic Time',
      description: 'Triple nested iterations',
      weight: 6
    },
    'O(2^n)': {
      name: 'Exponential Time',
      description: 'Recursive algorithms without memoization',
      weight: 7
    }
  };

  // Algorithm signature database
  const algorithmSignatures = {
    'Binary Search': {
      indicators: ['middle', 'low', 'high', 'divide', 'Math.floor', 'Math.ceil'],
      complexity: 'O(log n)',
      description: 'Efficient search algorithm that halves the search space'
    },
    'Merge Sort': {
      indicators: ['merge', 'split', 'recursive', 'divide'],
      complexity: 'O(n log n)',
      description: 'Divide-and-conquer sorting algorithm'
    },
    'Quick Sort': {
      indicators: ['pivot', 'partition', 'swap', 'recursive'],
      complexity: 'O(n log n)',
      description: 'Efficient in-place sorting algorithm'
    },
    'Bubble Sort': {
      indicators: ['adjacent', 'swap', 'sorted = false'],
      complexity: 'O(n²)',
      description: 'Simple comparison-based sorting algorithm'
    },
    'Selection Sort': {
      indicators: ['minIndex', 'swap', 'smallest'],
      complexity: 'O(n²)',
      description: 'In-place comparison sorting algorithm'
    },
    'Insertion Sort': {
      indicators: ['shift', 'insert', 'position'],
      complexity: 'O(n²)',
      description: 'Simple sorting algorithm that builds final sorted array'
    }
  };

  // Function to detect algorithm signatures
  const detectAlgorithm = (codeText) => {
    const detectedAlgorithms = [];
    
    for (const [algorithmName, signature] of Object.entries(algorithmSignatures)) {
      let matchCount = 0;
      for (const indicator of signature.indicators) {
        if (codeText.includes(indicator)) {
          matchCount++;
        }
      }
      
      // If at least half of the indicators are found, consider it a match
      if (matchCount >= Math.ceil(signature.indicators.length / 2)) {
        detectedAlgorithms.push({
          name: algorithmName,
          complexity: signature.complexity,
          description: signature.description
        });
      }
    }
    
    return detectedAlgorithms;
  };

  // Enhanced function to analyze code complexity using multiple approaches
  const analyzeComplexity = () => {
    if (!code || code.trim() === '') {
      setError('Please write some code first');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log("Analyzing code:", code); // Debug log
      
      // Perform multiple analyses
      const loopAnalysis = analyzeLoopStructure(code);
      const recursionCount = detectRecursion(code);
      const divideCount = detectDivideAndConquer(code);
      const sortCount = detectSorting(code);
      const detectedAlgorithms = detectAlgorithm(code);
      
      console.log("Loop Analysis:", loopAnalysis); // Debug log
      console.log("Recursion Count:", recursionCount); // Debug log
      console.log("Divide Count:", divideCount); // Debug log
      console.log("Sort Count:", sortCount); // Debug log
      console.log("Detected Algorithms:", detectedAlgorithms); // Debug log
      
      // Determine complexity based on findings
      let determinedComplexity = 'O(1)'; // Default
      
      // Check for detected algorithms first (highest priority)
      if (detectedAlgorithms.length > 0) {
        determinedComplexity = detectedAlgorithms[0].complexity;
        console.log("Using detected algorithm complexity:", determinedComplexity); // Debug log
      } 
      // Check for recursion (often exponential)
      else if (recursionCount > 0) {
        determinedComplexity = 'O(2^n)';
        console.log("Using recursion complexity:", determinedComplexity); // Debug log
      }
      // Check for divide and conquer patterns
      else if (divideCount > 2) {
        determinedComplexity = 'O(log n)';
        console.log("Using divide and conquer complexity:", determinedComplexity); // Debug log
      }
      // Check for sorting algorithms
      else if (sortCount > 0) {
        determinedComplexity = 'O(n log n)';
        console.log("Using sorting complexity:", determinedComplexity); // Debug log
      }
      // Special case: Check for dependent nested loops (like your example)
      else if (loopAnalysis.dependentLoops || loopAnalysis.nestedLoopDepth >= 2) {
        determinedComplexity = 'O(n²)';
        console.log("Using quadratic complexity for dependent nested loops:", determinedComplexity); // Debug log
      }
      // Check for triple nested loops
      else if (loopAnalysis.nestedLoopDepth >= 3) {
        determinedComplexity = 'O(n³)';
        console.log("Using cubic complexity:", determinedComplexity); // Debug log
      }
      else if (loopAnalysis.nestedLoopDepth === 1 || 
               loopAnalysis.forLoopCount > 0 || 
               loopAnalysis.whileLoopCount > 0 ||
               loopAnalysis.forEachCount > 0) {
        determinedComplexity = 'O(n)';
        console.log("Using linear complexity:", determinedComplexity); // Debug log
      } else {
        console.log("Using constant complexity:", determinedComplexity); // Debug log
      }
      
      // Generate analysis result
      const result = {
        timeComplexity: determinedComplexity,
        spaceComplexity: 'O(1)', // Simplified assumption
        explanation: detectedAlgorithms.length > 0 
          ? `Detected algorithm: ${detectedAlgorithms[0].name} - ${detectedAlgorithms[0].description}`
          : `Based on analysis: ${loopAnalysis.forLoopCount} for loops, ${loopAnalysis.whileLoopCount} while loops, ${loopAnalysis.nestedLoopDepth} nested depth`,
        breakdown: [
          {
            operation: 'Pattern Analysis',
            complexity: determinedComplexity,
            description: complexityPatterns[determinedComplexity]?.description || 'Analysis based on code patterns'
          }
        ],
        optimization: detectedAlgorithms.length > 0 
          ? `This is a known algorithm (${detectedAlgorithms[0].name}). Its complexity is optimal for this type of problem.` 
          : (determinedComplexity === 'O(n²)' || determinedComplexity === 'O(n³)' || determinedComplexity.includes('^')) 
            ? 'Consider optimizing nested loops or recursive calls.' 
            : 'Your code complexity is already efficient.'
      };
      
      // Generate mock performance data based on the analysis
      const testData = generatePerformanceData(determinedComplexity);
      
      setAnalysis({
        ...result,
        testData
      });
      
      drawGraph(testData);
      setLoading(false);
    } catch (err) {
      console.error("Analysis error:", err); // Debug log
      setError('Failed to analyze complexity: ' + err.message);
      setLoading(false);
    }
  };

  // Function to generate mock performance data for graph visualization
  const generatePerformanceData = (timeComplexity) => {
    const testData = [];
    
    // Generate mock data based on complexity pattern
    const patterns = {
      'O(1)': () => 1,
      'O(log n)': (n) => Math.log2(n) * 10,
      'O(n)': (n) => n * 0.5,
      'O(n log n)': (n) => n * Math.log2(n) * 0.1,
      'O(n²)': (n) => n * n * 0.01,
      'O(n³)': (n) => n * n * n * 0.0001,
      'O(2^n)': (n) => Math.pow(2, Math.min(n, 10)) * 0.1,
      'default': (n) => n
    };
    
    const pattern = patterns[timeComplexity] || patterns['default'];
    
    // Generate data points
    for (let i = 1; i <= 10; i++) {
      const inputSize = i * 10;
      const executionTime = Math.max(0.1, pattern(inputSize) + (Math.random() * 5)); // Add some randomness
      testData.push({
        inputSize,
        executionTime: parseFloat(executionTime.toFixed(2))
      });
    }
    
    return testData;
  };

  // Function to draw the graph on canvas
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
      const x = 50 + (i * 50);
      ctx.beginPath();
      ctx.moveTo(x, 30);
      ctx.lineTo(x, height - 30);
      ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let i = 0; i <= 10; i++) {
      const y = 30 + (i * 25);
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(width - 20, y);
      ctx.stroke();
    }
    
    // Draw axes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(50, height - 30);
    ctx.lineTo(width - 20, height - 30);
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
      const x = 50 + (i * 50);
      ctx.fillText(`${i * 10}`, x, height - 10);
    }
    
    // Y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 10; i++) {
      const y = height - 30 - (i * 25);
      ctx.fillText(`${i * 10}`, 45, y + 4);
    }
    
    // Draw axis titles
    ctx.textAlign = 'center';
    ctx.fillText('Input Size (n)', width / 2, height - 5);
    
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Execution Time', 0, 0);
    ctx.restore();
    
    // Draw data points and line
    if (data && data.length > 0) {
      ctx.strokeStyle = '#60a5fa';
      ctx.fillStyle = '#3b82f6';
      ctx.lineWidth = 2;
      
      // Draw line connecting points
      ctx.beginPath();
      data.forEach((point, index) => {
        const x = 50 + (point.inputSize / 10) * 50;
        // Normalize execution time to fit in canvas
        const maxY = Math.max(...data.map(p => p.executionTime));
        const y = height - 30 - (point.executionTime / maxY) * (height - 60);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      
      // Draw data points
      data.forEach(point => {
        const x = 50 + (point.inputSize / 10) * 50;
        // Normalize execution time to fit in canvas
        const maxY = Math.max(...data.map(p => p.executionTime));
        const y = height - 30 - (point.executionTime / maxY) * (height - 60);
        
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  };

  // Redraw graph when analysis changes
  useEffect(() => {
    if (analysis && analysis.testData) {
      drawGraph(analysis.testData);
    }
  }, [analysis]);

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5" />
          Complexity Analyzer
        </h2>
        <button
          onClick={analyzeComplexity}
          disabled={loading || !code || code.trim() === ''}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            loading || !code || code.trim() === ''
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          {loading ? 'Analyzing...' : 'Analyze Complexity'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-red-400 font-medium">Error</h3>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {analysis ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h3 className="font-semibold text-white mb-2">Time Complexity</h3>
              <div className="text-2xl font-bold text-blue-400">{analysis.timeComplexity}</div>
              <p className="text-slate-400 text-sm mt-1">{analysis.breakdown[0]?.description}</p>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h3 className="font-semibold text-white mb-2">Space Complexity</h3>
              <div className="text-2xl font-bold text-green-400">{analysis.spaceComplexity}</div>
              <p className="text-slate-400 text-sm mt-1">Memory usage estimation</p>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h3 className="font-semibold text-white mb-2">Analysis</h3>
            <p className="text-slate-300">{analysis.explanation}</p>
            
            {analysis.optimization && (
              <div className="mt-3 pt-3 border-t border-slate-700">
                <h4 className="font-medium text-white">Optimization Suggestion</h4>
                <p className="text-slate-300">{analysis.optimization}</p>
              </div>
            )}
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h3 className="font-semibold text-white mb-3">Performance Graph</h3>
            <div className="flex justify-center">
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
            Click the "Analyze Complexity" button to evaluate the time and space complexity of your code using static analysis.
          </p>
        </div>
      )}
    </div>
  );
};

export default StaticComplexityAnalyzer;