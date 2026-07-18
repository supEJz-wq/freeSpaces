import React, { useState, useEffect } from 'react';
import { Shield, LogOut, Sun, Moon } from 'lucide-react';
import AdminStats from '../Components/admin/AdminStats';
import ModerationTable from '../Components/admin/ModerationTable';
import ControlPanel from '../Components/Admin/ControlPanel';
import AdminGuidelines from '../Components/admin/AdminGuidelines';
import FeedbackReportsTable from '../Components/Admin/FeedbackReportsTable';
import PostcardsTable from '../Components/Admin/PostcardsTable';
import { supabase } from '../lib/supabase';
import {
  fetchPosts, deletePost, purgeExpiredPosts,
  fetchReportedIds, unreportPost,
  fetchSettings, updateSetting,
  resetIdentity, hardDeletePostsByDevice, hardResetDatabase,
  fetchBugReports, deleteBugReport, deleteBugReports,
  fetchPostcards, deletePostcard, deletePostcards
} from '../lib/api';

const ADMIN_PASSWORD = 'freespace123';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');

  const [allPosts, setAllPosts] = useState([]);
  const [reportedPostIds, setReportedPostIds] = useState([]);
  const [blacklistedWords, setBlacklistedWords] = useState(['spam', 'hate']);
  const [settings, setSettings] = useState({ autoDeleteHours: 10 });
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(Math.floor(Math.random() * 15) + 5);
  const [activeAdminTab, setActiveAdminTab] = useState('moderation'); // 'moderation', 'feedback', 'guidelines', 'postcards'
  const [bugReports, setBugReports] = useState([]);
  const [postcards, setPostcards] = useState([]);

  // ========== AUTH CHECK ==========
  useEffect(() => {
    const savedAuth = localStorage.getItem('freespace_admin_auth');
    if (savedAuth === 'true') setIsAuthenticated(true);
  }, []);

  // ========== LOAD DATA FROM SUPABASE ==========
  useEffect(() => {
    if (!isAuthenticated) return;
    const load = async () => {
      const [posts, reportedIds, s, feedback, fetchedPostcards] = await Promise.all([
        fetchPosts(),
        fetchReportedIds(),
        fetchSettings(),
        fetchBugReports(),
        fetchPostcards(),
      ]);
      setAllPosts(posts);
      setReportedPostIds(reportedIds);
      setBugReports(feedback);
      setPostcards(fetchedPostcards);
      if (s.blacklisted_words) setBlacklistedWords(s.blacklisted_words);
      if (s.auto_delete_hours) setSettings(prev => ({ ...prev, autoDeleteHours: s.auto_delete_hours }));
    };
    load();
  }, [isAuthenticated]);

  // ========== REALTIME ==========
  useEffect(() => {
    if (!isAuthenticated) return;
    const postsChannel = supabase
      .channel('admin-posts-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        async () => { setAllPosts(await fetchPosts()); })
      .subscribe();

    const feedbackChannel = supabase
      .channel('admin-feedback-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'bug_reports' },
        async () => { setBugReports(await fetchBugReports()); })
      .subscribe();

    const postcardsChannel = supabase
      .channel('admin-postcards-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'postcards' },
        async () => { setPostcards(await fetchPostcards()); })
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(feedbackChannel);
      supabase.removeChannel(postcardsChannel);
    };
  }, [isAuthenticated]);

  // ========== ONLINE USERS SIMULATION ==========
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      setOnlineUsers(prev => Math.max(1, prev + (Math.random() > 0.5 ? 1 : -1)));
    }, 3000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // ========== AUTH HANDLERS ==========
  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('freespace_admin_auth', 'true');
      setError('');
    } else {
      setError('Incorrect password. Access denied.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('freespace_admin_auth');
  };

  // ========== POST ACTIONS ==========
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post permanently?')) return;
    await deletePost(postId);
    setAllPosts(prev => prev.filter(p => p.id !== postId));
    setReportedPostIds(prev => prev.filter(id => id !== postId));
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('⚠️ WARNING: Delete ALL posts? This cannot be undone!')) return;
    await Promise.all(allPosts.map(p => deletePost(p.id)));
    setAllPosts([]);
    setReportedPostIds([]);
  };

  const handlePurgeExpired = async () => {
    if (!window.confirm('This will permanently delete all posts older than 10 hours from the database. Proceed?')) return;
    await purgeExpiredPosts();
    setAllPosts(await fetchPosts());
    alert('Expired posts purged successfully!');
  };

  const handleBulkDelete = async (postIds) => {
    if (postIds.length === 0) return;
    if (!window.confirm(`⚠️ Delete ${postIds.length} selected posts?`)) return;
    await Promise.all(postIds.map(id => deletePost(id)));
    setAllPosts(prev => prev.filter(p => !postIds.includes(p.id)));
    setReportedPostIds(prev => prev.filter(id => !postIds.includes(id)));
  };

  const handleResetUser = async (deviceId) => {
    if (!window.confirm("Unlock this user's name and clear their post history?")) return;
    await resetIdentity(deviceId);
    await hardDeletePostsByDevice(deviceId);
    setAllPosts(await fetchPosts());
    alert("User has been reset.");
  };

  const handleHardReset = async () => {
    if (!window.confirm("☢️ NUCLEAR RESET: This will delete ALL posts and UNLOCK ALL names for everyone. Are you 100% sure?")) return;
    const pass = window.prompt("Type 'RESET' to confirm:");
    if (pass !== 'RESET') return;

    await hardResetDatabase();
    setAllPosts([]);
    setReportedPostIds([]);
    alert("The entire database has been wiped.");
  };

  // ========== REPORT ACTIONS ==========
  const handleClearReport = async (postId) => {
    await unreportPost(postId);
    setReportedPostIds(prev => prev.filter(id => id !== postId));
  };

  const handleBulkApprove = async (postIds) => {
    if (postIds.length === 0) return;
    await Promise.all(postIds.map(id => unreportPost(id)));
    setReportedPostIds(prev => prev.filter(id => !postIds.includes(id)));
  };

  // ========== BLACKLIST ACTIONS ==========
  const handleAddWord = async (word) => {
    const lw = word.toLowerCase();
    if (blacklistedWords.includes(lw)) return;
    const updated = [...blacklistedWords, lw];
    setBlacklistedWords(updated);
    await updateSetting('blacklisted_words', updated);
  };

  const handleRemoveWord = async (wordToRemove) => {
    const updated = blacklistedWords.filter(w => w !== wordToRemove);
    setBlacklistedWords(updated);
    await updateSetting('blacklisted_words', updated);
  };

  const handleSettingsChange = async (newSettings) => {
    const oldSettings = { ...settings };
    setSettings(newSettings);

    // Persist to Supabase if they actually changed
    if (newSettings.autoDeleteHours !== oldSettings.autoDeleteHours) {
      await updateSetting('auto_delete_hours', newSettings.autoDeleteHours);
    }
  };

  const handleDeleteFeedback = async (id) => {
    await deleteBugReport(id);
    setBugReports(prev => prev.filter(r => r.id !== id));
  };

  const handleBulkDeleteFeedback = async (ids) => {
    if (ids.length === 0) return;
    if (!window.confirm(`Delete ${ids.length} selected report(s)?`)) return;
    await deleteBugReports(ids);
    setBugReports(prev => prev.filter(r => !ids.includes(r.id)));
  };

  const handleDeleteAllFeedback = async (ids) => {
    if (ids.length === 0) return;
    if (!window.confirm(`⚠️ Delete ALL ${ids.length} report(s) in this view? This cannot be undone!`)) return;
    await deleteBugReports(ids);
    setBugReports(prev => prev.filter(r => !ids.includes(r.id)));
  };

  // ========== POSTCARD ACTIONS ==========
  const handleDeletePostcard = async (id) => {
    if (!window.confirm('Delete this postcard?')) return;
    await deletePostcard(id);
    setPostcards(prev => prev.filter(p => p.id !== id));
  };

  const handleBulkDeletePostcards = async (ids) => {
    if (ids.length === 0) return;
    if (!window.confirm(`Delete ${ids.length} selected postcards?`)) return;
    await deletePostcards(ids);
    setPostcards(prev => prev.filter(p => !ids.includes(p.id)));
  };

  // ========== THEME ==========
  const theme = {
    mainBg: isDarkMode ? 'bg-stone-900' : 'bg-gray-100',
    mainText: isDarkMode ? 'text-white' : 'text-gray-900',
    cardBg: isDarkMode ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300 shadow-md',
    inputBg: isDarkMode ? 'bg-white/10 border-white/20 text-white' : 'bg-gray-50 border-gray-400 text-gray-900',
    subText: isDarkMode ? 'text-gray-400' : 'text-gray-600',
  };

  // ========== LOGIN SCREEN ==========
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${theme.mainBg} ${theme.mainText}`}>
        <div className={`backdrop-blur-xl p-8 rounded-3xl border shadow-2xl w-full max-w-sm text-center ${theme.cardBg}`}>
          <Shield className="mx-auto text-rose-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold mb-2">Admin Access</h2>
          <p className={`text-sm mb-6 ${theme.subText}`}>Enter the admin password to continue.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Password"
              className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-rose-500 ${theme.inputBg}`}
              required
            />
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
            <button type="submit" className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:from-rose-600 hover:to-pink-600 transition-all">
              Enter Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ========== ADMIN DASHBOARD ==========
  return (
    <div className={`min-h-screen p-8 transition-colors duration-300 ${theme.mainBg} ${theme.mainText}`}>
      <div className="max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold text-transparent bg-clip-text ${isDarkMode ? 'bg-gradient-to-r from-rose-400 to-pink-400' : 'bg-gradient-to-r from-rose-600 to-pink-600'}`}>
              Admin Dashboard 🛡️
            </h1>
            <p className={`mt-1 ${theme.subText}`}>Moderate and manage the FreeSpace community.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-yellow-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={handlePurgeExpired}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${isDarkMode ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400' : 'bg-orange-100 hover:bg-orange-200 text-orange-700'}`}
              title="Delete all posts older than 10 hours"
            >
              🧹 Purge Expired
            </button>

            <button
              onClick={handleHardReset}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors border-2 ${isDarkMode ? 'border-red-500/30 hover:bg-red-500/20 text-red-500' : 'border-red-200 hover:bg-red-50 text-red-600'}`}
              title="WIPE EVERYTHING (Developer Only)"
            >
              ☢️ Nuclear Reset
            </button>

            <button
              onClick={handleLogout}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveAdminTab('moderation')}
            className={`px-6 py-2 rounded-xl font-bold transition-all ${activeAdminTab === 'moderation' ? 'bg-rose-600 text-white' : (isDarkMode ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-white text-gray-600 hover:bg-gray-50')}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveAdminTab('postcards')}
            className={`px-6 py-2 rounded-xl font-bold transition-all ${activeAdminTab === 'postcards' ? 'bg-rose-600 text-white' : (isDarkMode ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-white text-gray-600 hover:bg-gray-50')}`}
          >
            Postcards ({postcards.length})
          </button>
          <button
            onClick={() => setActiveAdminTab('feedback')}
            className={`px-6 py-2 rounded-xl font-bold transition-all ${activeAdminTab === 'feedback' ? 'bg-rose-600 text-white' : (isDarkMode ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-white text-gray-600 hover:bg-gray-50')}`}
          >
            Feedback ({bugReports.length})
          </button>
          <button
            onClick={() => setActiveAdminTab('guidelines')}
            className={`px-6 py-2 rounded-xl font-bold transition-all ${activeAdminTab === 'guidelines' ? 'bg-rose-600 text-white' : (isDarkMode ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-white text-gray-600 hover:bg-gray-50')}`}
          >
            Guidelines
          </button>
        </div>

        <AdminStats posts={allPosts} onlineUsers={onlineUsers} isDarkMode={isDarkMode} />

        {activeAdminTab === 'moderation' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <div className="lg:col-span-1">
              <ControlPanel
                settings={settings}
                onSettingsChange={handleSettingsChange}
                isDarkMode={isDarkMode}
                blacklistedWords={blacklistedWords}
                onAddWord={handleAddWord}
                onRemoveWord={handleRemoveWord}
              />
            </div>
            <div className="lg:col-span-2">
              <ModerationTable
                posts={allPosts}
                onDeletePost={handleDeletePost}
                onDeleteAll={handleDeleteAll}
                isDarkMode={isDarkMode}
                reportedPostIds={reportedPostIds}
                onClearReport={handleClearReport}
                onBulkDelete={handleBulkDelete}
                onBulkApprove={handleBulkApprove}
                onResetUser={handleResetUser}
              />
            </div>
          </div>
        ) : activeAdminTab === 'feedback' ? (
          <div className="mt-8">
            <FeedbackReportsTable
              reports={bugReports}
              onDeleteReport={handleDeleteFeedback}
              onBulkDeleteReports={handleBulkDeleteFeedback}
              onDeleteAllReports={handleDeleteAllFeedback}
              isDarkMode={isDarkMode}
            />
          </div>
        ) : activeAdminTab === 'postcards' ? (
          <div className="mt-8">
            <PostcardsTable 
              postcards={postcards}
              onDeletePostcard={handleDeletePostcard}
              onBulkDelete={handleBulkDeletePostcards}
              isDarkMode={isDarkMode}
            />
          </div>
        ) : (
          <div className="mt-8">
            <AdminGuidelines isDarkMode={isDarkMode} />
          </div>
        )}

      </div>
    </div>
  );
};

export default Admin;