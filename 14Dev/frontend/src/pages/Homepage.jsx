// import { useEffect, useState } from 'react';
// import { NavLink } from 'react-router'; // Fixed import
// import { useDispatch, useSelector } from 'react-redux';
// import axiosClient from '../utils/axiosClient';
// import { logoutUser } from '../authSlice';

// function Homepage() {
//   const dispatch = useDispatch();
//   const { user } = useSelector((state) => state.auth);
//   const [problems, setProblems] = useState([]);
//   const [solvedProblems, setSolvedProblems] = useState([]);
//   const [filters, setFilters] = useState({
//     difficulty: 'all',
//     tag: 'all',
//     status: 'all' 
//   });

//   useEffect(() => {
//     const fetchProblems = async () => {
//       try {
//         const { data } = await axiosClient.get('/problem/getAllProblem');
//         setProblems(data);
//       } catch (error) {
//         console.error('Error fetching problems:', error);
//       }
//     };

//     const fetchSolvedProblems = async () => {
//       try {
//         const { data } = await axiosClient.get('/problem/problemSolvedByUser');
//         setSolvedProblems(data);
//       } catch (error) {
//         console.error('Error fetching solved problems:', error);
//       }
//     };

//     fetchProblems();
//     if (user) fetchSolvedProblems();
//   }, [user]);

//   const handleLogout = () => {
//     dispatch(logoutUser());
//     setSolvedProblems([]); // Clear solved problems on logout
//   };

//   const filteredProblems = problems.filter(problem => {
//     const difficultyMatch = filters.difficulty === 'all' || problem.difficulty === filters.difficulty;
//     const tagMatch = filters.tag === 'all' || problem.tags === filters.tag;
//     const statusMatch = filters.status === 'all' || 
//                       solvedProblems.some(sp => sp._id === problem._id);
//     return difficultyMatch && tagMatch && statusMatch;
//   });

//   return (
//     <div className="min-h-screen bg-base-200">
//       {/* Navigation Bar */}
//       <nav className="navbar bg-base-100 shadow-lg px-4">
//         <div className="flex-1">
//           <NavLink to="/" className="btn btn-ghost text-xl">LeetCode</NavLink>
//         </div>
//         <div className="flex-none gap-4">
//           <div className="dropdown dropdown-end">
//             <div tabIndex={0} className="btn btn-ghost">
//               {user?.firstName}
//             </div>
//             <ul className="mt-3 p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
//               <li><button onClick={handleLogout}>Logout</button></li>
//               {user.role=='admin'&&<li><NavLink to="/admin">Admin</NavLink></li>}
//             </ul>
//           </div>
//         </div>
//       </nav>

//       {/* Main Content */}
//       <div className="container mx-auto p-4">
//         {/* Filters */}
//         <div className="flex flex-wrap gap-4 mb-6">
//           {/* New Status Filter */}
//           <select 
//             className="select select-bordered"
//             value={filters.status}
//             onChange={(e) => setFilters({...filters, status: e.target.value})}
//           >
//             <option value="all">All Problems</option>
//             <option value="solved">Solved Problems</option>
//           </select>

//           <select 
//             className="select select-bordered"
//             value={filters.difficulty}
//             onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
//           >
//             <option value="all">All Difficulties</option>
//             <option value="easy">Easy</option>
//             <option value="medium">Medium</option>
//             <option value="hard">Hard</option>
//           </select>

//           <select 
//             className="select select-bordered"
//             value={filters.tag}
//             onChange={(e) => setFilters({...filters, tag: e.target.value})}
//           >
//             <option value="all">All Tags</option>
//             <option value="array">Array</option>
//             <option value="linkedList">Linked List</option>
//             <option value="graph">Graph</option>
//             <option value="dp">DP</option>
//           </select>
//         </div>

//         {/* Problems List */}
//         <div className="grid gap-4">
//           {filteredProblems.map(problem => (
//             <div key={problem._id} className="card bg-base-100 shadow-xl">
//               <div className="card-body">
//                 <div className="flex items-center justify-between">
//                   <h2 className="card-title">
//                     <NavLink to={`/problem/${problem._id}`} className="hover:text-primary">
//                       {problem.title}
//                     </NavLink>
//                   </h2>
//                   {solvedProblems.some(sp => sp._id === problem._id) && (
//                     <div className="badge badge-success gap-2">
//                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
//                         <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//                       </svg>
//                       Solved
//                     </div>
//                   )}
//                 </div>
                
//                 <div className="flex gap-2">
//                   <div className={`badge ${getDifficultyBadgeColor(problem.difficulty)}`}>
//                     {problem.difficulty}
//                   </div>
//                   <div className="badge badge-info">
//                     {problem.tags}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// const getDifficultyBadgeColor = (difficulty) => {
//   switch (difficulty.toLowerCase()) {
//     case 'easy': return 'badge-success';
//     case 'medium': return 'badge-warning';
//     case 'hard': return 'badge-error';
//     default: return 'badge-neutral';
//   }
// };

// export default Homepage;


import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '../utils/axiosClient';
import { logoutUser } from '../authSlice';
import { Code2, Trophy, Target, Zap, Filter, User, LogOut, Shield, CheckCircle2, Circle, Flame, Users } from 'lucide-react';

function Homepage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [problems, setProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [userStreak, setUserStreak] = useState({ currentStreak: 0 });
  const [filters, setFilters] = useState({
    difficulty: 'all',
    tag: 'all',
    status: 'all' 
  });

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const { data } = await axiosClient.get('/problem/getAllProblem');
        setProblems(data);
      } catch (error) {
        console.error('Error fetching problems:', error);
      }
    };

    const fetchSolvedProblems = async () => {
      try {
        const { data } = await axiosClient.get('/problem/problemSolvedByUser');
        setSolvedProblems(data);
      } catch (error) {
        console.error('Error fetching solved problems:', error);
      }
    };

    const fetchUserStreak = async () => {
      try {
        const { data } = await axiosClient.get('/daily-challenge/streak');
        setUserStreak(data);
      } catch (error) {
        console.error('Error fetching user streak:', error);
      }
    };

    fetchProblems();
    if (user) {
      fetchSolvedProblems();
      fetchUserStreak();
    }
  }, [user]);

  const handleLogout = () => {
    dispatch(logoutUser());
    setSolvedProblems([]);
  };

  const filteredProblems = problems.filter(problem => {
    const difficultyMatch = filters.difficulty === 'all' || problem.difficulty === filters.difficulty;
    const tagMatch = filters.tag === 'all' || problem.tags === filters.tag;
    const statusMatch = filters.status === 'all' || 
                      solvedProblems.some(sp => sp._id === problem._id);
    return difficultyMatch && tagMatch && statusMatch;
  });

  const stats = {
    total: problems.length,
    solved: solvedProblems.length,
    easy: problems.filter(p => p.difficulty === 'easy').length,
    medium: problems.filter(p => p.difficulty === 'medium').length,
    hard: problems.filter(p => p.difficulty === 'hard').length,
    solvedPercentage: problems.length ? Math.round((solvedProblems.length / problems.length) * 100) : 0
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Professional Navigation Bar */}
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-xl">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <NavLink to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative bg-blue-600 p-2.5 rounded-lg group-hover:bg-blue-500 transition-all">
                  <Code2 className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <span className="text-2xl font-bold text-white tracking-tight">Head-2-Code</span>
                <div className="text-xs text-slate-400 font-medium">Master Your Coding Skills</div>
              </div>
            </NavLink>
            
            <div className="flex items-center gap-6">
              <NavLink
                to="/daily-challenge"
                className="hidden md:flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 px-4 py-2 rounded-lg border border-orange-500/50 hover:from-orange-500 hover:to-red-500 transition-all shadow-lg shadow-orange-500/20"
              >
                <Flame className="w-4 h-4 text-white" />
                <span className="text-sm font-semibold text-white">Daily Challenge</span>
              </NavLink>
              
              <NavLink
                to="/friend-arena"
                className="hidden md:flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-700 transition-all"
              >
                <Users className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-semibold text-white">Friend Arena</span>
              </NavLink>
              
              <NavLink
                to="/contests"
                className="hidden md:flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-700 transition-all"
              >
                <Trophy className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold text-white">Contests</span>
              </NavLink>
              
              <div
                className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-lg border ${
                  userStreak.currentStreak > 0
                    ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/40'
                    : 'bg-slate-800 border-slate-700'
                }`}
              >
                <Flame
                  className={`w-4 h-4 ${
                    userStreak.currentStreak > 0 ? 'text-orange-400' : 'text-slate-500'
                  }`}
                  fill={userStreak.currentStreak > 0 ? '#fb923c' : 'none'}
                  strokeWidth={2.2}
                />
                <span className="text-sm font-semibold text-white">
                  {userStreak.currentStreak || 0}
                </span>
                <span className="text-sm text-slate-300">
                  {userStreak.currentStreak === 1 ? 'day streak' : 'day streak'}
                </span>
              </div>
              
              <div className="hidden md:flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                <Target className="w-4 h-4 text-green-500" />
                <span className="text-sm font-semibold text-white">{solvedProblems.length}</span>
                <span className="text-sm text-slate-400">Solved</span>
              </div>
              
              <div className="dropdown dropdown-end">
                <div tabIndex={0} className="flex items-center gap-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-all border border-slate-700">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white font-medium">{user?.firstName}</span>
                </div>
                <ul className="mt-2 p-2 shadow-2xl menu menu-sm dropdown-content bg-slate-800 rounded-xl w-52 border border-slate-700">
                  {user.role === 'admin' && (
                    <li>
                      <NavLink to="/admin" className="hover:bg-slate-700 text-slate-200 rounded-lg">
                        <Shield className="w-4 h-4" />
                        Admin Panel
                      </NavLink>
                    </li>
                  )}
                  <li>
                    <button onClick={handleLogout} className="hover:bg-slate-700 text-slate-200 rounded-lg">
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Dashboard */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-6">Your Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10">
              <div className="flex items-center justify-between mb-3">
                <Target className="w-8 h-8 text-blue-500" />
                <span className="text-4xl font-bold text-white">{stats.total}</span>
              </div>
              <div className="text-slate-400 font-medium">Total Problems</div>
            </div>
            
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-emerald-500/50 transition-all hover:shadow-lg hover:shadow-emerald-500/10">
              <div className="flex items-center justify-between mb-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                <span className="text-4xl font-bold text-white">{stats.solved}</span>
              </div>
              <div className="text-slate-400 font-medium">Solved</div>
              <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.solvedPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-emerald-500/50 transition-all">
              <div className="flex items-center justify-between mb-3">
                <Circle className="w-6 h-6 text-emerald-500" />
                <span className="text-3xl font-bold text-white">{stats.easy}</span>
              </div>
              <div className="text-slate-400 font-medium">Easy</div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-amber-500/50 transition-all">
              <div className="flex items-center justify-between mb-3">
                <Circle className="w-6 h-6 text-amber-500" />
                <span className="text-3xl font-bold text-white">{stats.medium}</span>
              </div>
              <div className="text-slate-400 font-medium">Medium</div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-rose-500/50 transition-all">
              <div className="flex items-center justify-between mb-3">
                <Circle className="w-6 h-6 text-rose-500" />
                <span className="text-3xl font-bold text-white">{stats.hard}</span>
              </div>
              <div className="text-slate-400 font-medium">Hard</div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-slate-900 rounded-2xl p-6 mb-8 border border-slate-800">
          <div className="flex items-center gap-3 mb-5">
            <Filter className="w-5 h-5 text-blue-500" />
            <h3 className="text-xl font-bold text-white">Filter Problems</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-400 mb-2 block">Status</label>
              <select 
                className="w-full bg-slate-800 border-slate-700 text-white rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <option value="all">All Problems</option>
                <option value="solved">Solved Problems</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-400 mb-2 block">Difficulty</label>
              <select 
                className="w-full bg-slate-800 border-slate-700 text-white rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                value={filters.difficulty}
                onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-400 mb-2 block">Tags</label>
              <select 
                className="w-full bg-slate-800 border-slate-700 text-white rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                value={filters.tag}
                onChange={(e) => setFilters({...filters, tag: e.target.value})}
              >
                <option value="all">All Tags</option>
                <option value="array">Array</option>
                <option value="linkedList">Linked List</option>
                <option value="graph">Graph</option>
                <option value="dp">DP</option>
              </select>
            </div>
          </div>
        </div>

        {/* Problems List Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            Problems <span className="text-slate-500">({filteredProblems.length})</span>
          </h2>
        </div>

        {/* Problems List */}
        <div className="space-y-3">
          {filteredProblems.map((problem, index) => {
            const isSolved = solvedProblems.some(sp => sp._id === problem._id);
            return (
              <div 
                key={problem._id} 
                className="group bg-slate-900 rounded-xl border border-slate-800 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/5"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <NavLink 
                        to={`/problem/${problem._id}`} 
                        className="text-lg font-semibold text-white hover:text-blue-400 transition-colors flex items-center gap-3 mb-3 group-hover:translate-x-1 transition-transform"
                      >
                        {isSolved ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-600 flex-shrink-0" />
                        )}
                        <span className="truncate">{problem.title}</span>
                      </NavLink>
                      
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${getDifficultyStyle(problem.difficulty)}`}>
                          {problem.difficulty.toUpperCase()}
                        </span>
                        <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {problem.tags}
                        </span>
                      </div>
                    </div>
                    
                    {isSolved && (
                      <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-lg border border-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm font-semibold">Solved</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="h-1 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-b-xl"></div>
              </div>
            );
          })}
        </div>

        {filteredProblems.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-slate-900 rounded-2xl p-12 border border-slate-800 inline-block">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-10 h-10 text-slate-600" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No problems found</h3>
              <p className="text-slate-400">Try adjusting your filters to see more problems</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const getDifficultyStyle = (difficulty) => {
  switch (difficulty.toLowerCase()) {
    case 'easy': 
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    case 'medium': 
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    case 'hard': 
      return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    default: 
      return 'bg-slate-800 text-slate-300 border border-slate-700';
  }
};

export default Homepage;