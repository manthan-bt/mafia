import { Home, Play, Trophy, Swords, ShoppingCart, Target, User, Shield } from 'lucide-react';

export const NAV_LINKS = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Play', path: '/play', icon: Play },
    { label: 'Ranked', path: '/ranked', icon: Trophy },
    { label: 'Tournaments', path: '/tournaments', icon: Swords },
    { label: 'Leaderboard', path: '/leaderboard', icon: Target },
    { label: 'Store', path: '/store', icon: ShoppingCart },
    { label: 'Battle Pass', path: '/battle-pass', icon: Shield },
    { label: 'Profile', path: '/profile', icon: User },
];
