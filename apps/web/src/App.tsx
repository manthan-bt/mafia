import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './contexts/SocketContext';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Store from './pages/Store';
import Tournament from './pages/Tournament';
import AdminDashboard from './pages/AdminDashboard';
import Play from './pages/Play';
import Ranked from './pages/Ranked';
import BattlePass from './pages/BattlePass';
import Settings from './pages/Settings';
import LanConnect from './pages/LanConnect';
import BotTraining from './pages/BotTraining';
import './index.css';
import Login from './pages/Login';

function App() {
    const isAuthenticated = !!localStorage.getItem('mafia_operative_alias');

    return (
        <Router>
            <SocketProvider>
                <div className="h-screen w-screen bg-[#050505] text-[#EAEAEA] relative font-michroma overflow-hidden">
                    <Routes>
                        {/* Independent Routes */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/lobby/:code" element={isAuthenticated ? <Lobby /> : <Login />} />
                        <Route path="/game/:code" element={isAuthenticated ? <Game /> : <Login />} />

                        {/* Fullscreen Game Routes */}
                        <Route path="/" element={<Home />} />
                        <Route path="/play" element={isAuthenticated ? <Play /> : <Login />} />
                        <Route path="/ranked" element={isAuthenticated ? <Ranked /> : <Login />} />
                        <Route path="/leaderboard" element={isAuthenticated ? <Leaderboard /> : <Login />} />
                        <Route path="/profile" element={isAuthenticated ? <Profile /> : <Login />} />
                        <Route path="/store" element={isAuthenticated ? <Store /> : <Login />} />
                        <Route path="/tournaments" element={isAuthenticated ? <Tournament /> : <Login />} />
                        <Route path="/battle-pass" element={isAuthenticated ? <BattlePass /> : <Login />} />
                        <Route path="/admin" element={isAuthenticated ? <AdminDashboard /> : <Login />} />
                        <Route path="/settings" element={isAuthenticated ? <Settings /> : <Login />} />
                        <Route path="/lan" element={<LanConnect />} />
                        <Route path="/bots" element={isAuthenticated ? <BotTraining /> : <Login />} />
                    </Routes>
                </div>
            </SocketProvider>
        </Router>
    );
}

export default App;
