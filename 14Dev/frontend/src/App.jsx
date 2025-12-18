import {Routes, Route ,Navigate} from "react-router";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Homepage from "./pages/Homepage";
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from "./authSlice";
import { useEffect } from "react";
import AdminPanel from "./components/AdminPanel";
import ProblemPage from "./pages/ProblemPage"
import Admin from "./pages/Admin";
import AdminVideo from "./components/AdminVideo"
import AdminDelete from "./components/AdminDelete"
import AdminUpload from "./components/AdminUpload"
import AdminUpdate from "./components/AdminUpdate"
import AdminCreateContest from "./components/AdminCreateContest"
import AdminManageContests from "./components/AdminManageContests"
import ContestsListPage from "./pages/ContestsListPage"
import ContestPage from "./pages/ContestPage"
import DailyChallengePage from "./pages/DailyChallengePage"
import FriendArenaLobby from "./pages/FriendArenaLobby"
import FriendArenaPage from "./pages/FriendArenaPage"

function App(){
  
  const dispatch = useDispatch();
  const {isAuthenticated,user,loading} = useSelector((state)=>state.auth);

  // check initial authentication
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <span className="loading loading-spinner loading-lg"></span>
    </div>;
  }

  return(
  <>
    <Routes>
      <Route path="/" element={isAuthenticated ?<Homepage></Homepage>:<Navigate to="/signup" />}></Route>
      <Route path="/login" element={isAuthenticated?<Navigate to="/" />:<Login></Login>}></Route>
      <Route path="/signup" element={isAuthenticated?<Navigate to="/" />:<Signup></Signup>}></Route>
      <Route path="/admin" element={isAuthenticated && user?.role === 'admin' ? <Admin /> : <Navigate to="/" />} />
      <Route path="/admin/create" element={isAuthenticated && user?.role === 'admin' ? <AdminPanel /> : <Navigate to="/" />} />
      <Route path="/admin/update" element={isAuthenticated && user?.role === 'admin' ? <AdminUpdate /> : <Navigate to="/" />} />
      <Route path="/admin/delete" element={isAuthenticated && user?.role === 'admin' ? <AdminDelete /> : <Navigate to="/" />} />
      <Route path="/admin/video" element={isAuthenticated && user?.role === 'admin' ? <AdminVideo /> : <Navigate to="/" />} />
      <Route path="/admin/upload/:problemId" element={isAuthenticated && user?.role === 'admin' ? <AdminUpload /> : <Navigate to="/" />} />
      <Route path="/admin/contests/create" element={isAuthenticated && user?.role === 'admin' ? <AdminCreateContest /> : <Navigate to="/" />} />
      <Route path="/admin/contests" element={isAuthenticated && user?.role === 'admin' ? <AdminManageContests /> : <Navigate to="/" />} />
      <Route path="/problem/:problemId" element={<ProblemPage/>}></Route>
      <Route path="/contests" element={isAuthenticated ? <ContestsListPage /> : <Navigate to="/signup" />} />
      <Route path="/contests/:contestId" element={isAuthenticated ? <ContestPage /> : <Navigate to="/signup" />} />
      <Route path="/daily-challenge" element={isAuthenticated ? <DailyChallengePage /> : <Navigate to="/signup" />} />
      <Route path="/friend-arena" element={isAuthenticated ? <FriendArenaLobby /> : <Navigate to="/signup" />} />
      <Route path="/friend-arena/:roomCode" element={isAuthenticated ? <FriendArenaPage /> : <Navigate to="/signup" />} />
      
    </Routes>
  </>
  )
}

export default App;