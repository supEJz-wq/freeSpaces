import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from '../Components/Header';
import LeftSidebar from '../Components/LeftSidebar';
import Feed from '../Components/Feed';
import RightSidebar from '../Components/RightSidebar';
import PostModal from '../Components/PostModal';
import BugReportModal from '../Components/BugReportModal'; // Added BugReportModal
import { supabase } from '../lib/supabase';
import {
  fetchPosts, createPost, deletePost,
  incrementLikes, addReactionDB, addCommentDB, addReplyDB, deleteCommentDB,
  fetchReportedIds, reportPost, unreportPost,
  fetchSettings, updateSetting,
  addCommentReactionDB,
} from '../lib/api';
import { Bug, Lightbulb } from 'lucide-react'; // Added Lightbulb
import { getStoredUsername } from '../lib/identity';

const getMyCommentName = () => getStoredUsername()?.name || 'You';

function Dashboard() {
  // ========== STATE ==========
  const [posts, setPosts]                   = useState([]);
  const [loading, setLoading]               = useState(true);
  const [activeMood, setActiveMood]         = useState('All Thoughts');
  const [searchQuery, setSearchQuery]       = useState('');
  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const [bugModalMode, setBugModalMode]     = useState('bug'); // Added bugModalMode
  const [activeTag, setActiveTag]           = useState(null);

  // ... (rest of the code)

  const openBugModal = (mode) => {
    setBugModalMode(mode);
    setIsBugModalOpen(true);
  };
  const [activeContributor, setActiveContributor] = useState(null);
  const [currentPage, setCurrentPage]       = useState(1);
  const POSTS_PER_PAGE = 4;

  const [myPostIds, setMyPostIds] = useState(() => {
    // Clear stale mock-data IDs when switching to Supabase backend
    const version = localStorage.getItem('ventspace_version');
    if (version !== 'supabase-v1') {
      localStorage.removeItem('ventspace_my_posts');
      localStorage.setItem('ventspace_version', 'supabase-v1');
      return [];
    }
    const saved = localStorage.getItem('ventspace_my_posts');
    return saved ? JSON.parse(saved) : [];
  });

  const [myCommentIds, setMyCommentIds] = useState(() => {
    const saved = localStorage.getItem('ventspace_my_comments');
    return saved ? JSON.parse(saved) : [];
  });

  const trackMyComment = (commentId) => {
    setMyCommentIds(prev => {
      if (prev.includes(commentId)) return prev;
      const updated = [...prev, commentId];
      localStorage.setItem('ventspace_my_comments', JSON.stringify(updated));
      return updated;
    });
  };

  const untrackMyComments = (commentIds) => {
    setMyCommentIds(prev => {
      const updated = prev.filter(id => !commentIds.includes(id));
      localStorage.setItem('ventspace_my_comments', JSON.stringify(updated));
      return updated;
    });
  };

  const [reportedPostIds, setReportedPostIds] = useState([]);
  const [blacklistedWords, setBlacklistedWords] = useState(['spam', 'hate']);
  const [autoDeleteHours, setAutoDeleteHours] = useState(10);

  const backgroundEmojis = ['🌸', '❤️‍🔥', '🕊️', '🥺', '☁️', '😻', '🦋'];

  // ========== SCROLL TO TOP ON MOUNT ==========
  useEffect(() => {
    // Disable browser scroll restoration so it doesn't auto-scroll down on refresh
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  // ========== INITIAL DATA LOAD ==========
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [fetchedPosts, reportedIds, settings] = await Promise.all([
        fetchPosts(),
        fetchReportedIds(),
        fetchSettings(),
      ]);
      setPosts(fetchedPosts);
      setReportedPostIds(reportedIds);
      if (settings.blacklisted_words) setBlacklistedWords(settings.blacklisted_words);
      if (settings.auto_delete_hours !== undefined) setAutoDeleteHours(Number(settings.auto_delete_hours));
      setLoading(false);
    };
    load();
  }, []);


  // ========== REALTIME SUBSCRIPTION ==========
  useEffect(() => {
    const channel = supabase
      .channel('posts-realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        async () => {
          const refreshed = await fetchPosts();
          setPosts(refreshed);
        })
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'posts' },
        async () => {
          const refreshed = await fetchPosts();
          setPosts(refreshed);
        })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // ========== ADD POST ==========
  const addPost = async (newPost) => {
    const created = await createPost(newPost);
    if (!created) return;
    setPosts(prev => [created, ...prev]);
    setCurrentPage(1);
    const updatedMyIds = [created.id, ...myPostIds];
    setMyPostIds(updatedMyIds);
    localStorage.setItem('ventspace_my_posts', JSON.stringify(updatedMyIds));
  };

  // ========== DELETE POST ==========
  const handleDeletePost = async (postId) => {
    await deletePost(postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
    const updatedMyIds = myPostIds.filter(id => id !== postId);
    setMyPostIds(updatedMyIds);
    localStorage.setItem('ventspace_my_posts', JSON.stringify(updatedMyIds));
  };

  // ========== LIKE ==========
  const toggleLike = async (postId) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    await incrementLikes(postId, post.likes);
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, likes: p.likes + 1 } : p
    ));
  };

  // ========== REACTION ==========
  const addReaction = async (postId, emoji, prevEmoji) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const updated = await addReactionDB(postId, emoji, prevEmoji, post.reactions || {});
    if (!updated) return;
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, reactions: updated } : p
    ));
  };

  // ========== COMMENT ==========
  const addComment = async (postId, commentText) => {
    const comment = await addCommentDB(postId, getMyCommentName(), commentText);
    if (!comment) return;
    trackMyComment(comment.id);
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, comments: [...p.comments, comment] }
        : p
    ));
  };

  const addReplyToTree = (comments, parentId, reply) =>
    comments.map(comment => {
      if (comment.id === parentId) {
        return { ...comment, replies: [...(comment.replies || []), reply] };
      }
      if (comment.replies?.length) {
        return { ...comment, replies: addReplyToTree(comment.replies, parentId, reply) };
      }
      return comment;
    });

  const addReply = async (postId, parentCommentId, replyText) => {
    const reply = await addReplyDB(postId, parentCommentId, getMyCommentName(), replyText);
    if (!reply) return;
    trackMyComment(reply.id);
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, comments: addReplyToTree(p.comments, parentCommentId, reply) }
        : p
    ));
  };

  const collectCommentIds = (comment) => [
    comment.id,
    ...(comment.replies || []).flatMap(collectCommentIds),
  ];

  const findCommentInTree = (comments, commentId) => {
    for (const comment of comments) {
      if (comment.id === commentId) return comment;
      const found = findCommentInTree(comment.replies || [], commentId);
      if (found) return found;
    }
    return null;
  };

  const removeCommentFromTree = (comments, commentId) =>
    comments
      .filter(c => c.id !== commentId)
      .map(c => ({
        ...c,
        replies: removeCommentFromTree(c.replies || [], commentId),
      }));

  const deleteComment = async (postId, commentId) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const target = findCommentInTree(post.comments, commentId);
    const canDelete = myCommentIds.includes(commentId)
      || target?.username === getMyCommentName();
    if (!canDelete) return;

    const ok = await deleteCommentDB(commentId);
    if (!ok) return;

    if (target) untrackMyComments(collectCommentIds(target));
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, comments: removeCommentFromTree(p.comments, commentId) }
        : p
    ));
  };

  // ========== COMMENT REACTION ==========
  const updateCommentReactionInTree = (comments, commentId, updatedReactions) =>
    comments.map(comment => {
      if (comment.id === commentId) return { ...comment, reactions: updatedReactions };
      if (comment.replies?.length) {
        return { ...comment, replies: updateCommentReactionInTree(comment.replies, commentId, updatedReactions) };
      }
      return comment;
    });

  const addCommentReaction = async (postId, commentId, emoji, prevEmoji) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const comment = findCommentInTree(post.comments, commentId);
    if (!comment) return;
    const updated = await addCommentReactionDB(commentId, emoji, prevEmoji, comment.reactions || {});
    if (!updated) return;
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, comments: updateCommentReactionInTree(p.comments, commentId, updated) }
        : p
    ));
  };

  // ========== REPORT ==========
  const handleReportPost = async (postId) => {
    if (!reportedPostIds.includes(postId)) {
      await reportPost(postId);
      setReportedPostIds(prev => [...prev, postId]);
      alert('Post reported to admins. Thank you for keeping VentSpace safe!');
    } else {
      await unreportPost(postId);
      setReportedPostIds(prev => prev.filter(id => id !== postId));
    }
  };

  // ========== PAGINATION ==========
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ========== FILTER HANDLERS ==========
  const handleMoodChange      = (mood)  => { setActiveMood(mood); setActiveTag(null); setActiveContributor(null); setSearchQuery(''); setCurrentPage(1); };
  const handleSearchChange    = (query) => { setSearchQuery(query); setActiveTag(null); setActiveContributor(null); setActiveMood('All Thoughts'); setCurrentPage(1); };
  const handleTagClick        = (tag)   => { setActiveTag(tag); setActiveContributor(null); setActiveMood('All Thoughts'); setSearchQuery(''); setCurrentPage(1); };
  const handleContributorClick= (name)  => { setActiveContributor(name); setActiveTag(null); setActiveMood('All Thoughts'); setSearchQuery(''); setCurrentPage(1); };
  const clearFilters          = ()      => { setActiveTag(null); setActiveContributor(null); setActiveMood('All Thoughts'); setSearchQuery(''); setCurrentPage(1); };

  // ========== FILTERING LOGIC ==========
  const filteredPosts = useMemo(() => {
    const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return posts.filter(post => {
      const matchesMood = activeMood === 'All Thoughts' ||
        (activeMood === 'My Posts' ? myPostIds.includes(post.id) : post.mood === activeMood);
      const matchesSearch =
        post.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.mood.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !activeTag || post.text.toLowerCase().includes(activeTag.toLowerCase());
      const matchesContributor = !activeContributor || post.username === activeContributor;
      return matchesMood && matchesSearch && matchesTag && matchesContributor;
    }).map(post => {
      let censoredText = post.text;
      blacklistedWords.forEach(word => {
        if (!word.trim()) return;
        const regex = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'gi');
        censoredText = censoredText.replace(regex, match => '*'.repeat(match.length));
      });
      return { ...post, text: censoredText };
    });
  }, [posts, activeMood, searchQuery, activeTag, activeContributor, myPostIds, blacklistedWords]);

  // ========== PAGINATION SLICING ==========
  const totalPages   = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const currentPosts = filteredPosts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);

  // ========== SIDEBAR DATA ==========
  const moodData = useMemo(() => {
    const counts = { Happy: 0, Sad: 0, Angry: 0, Hopeful: 0, Anxious: 0 };
    posts.forEach(p => { if (counts[p.mood] !== undefined) counts[p.mood]++; });
    const total = posts.length;
    return Object.keys(counts).map(name => ({
      name,
      value: total > 0 ? Math.round((counts[name] / total) * 100) : 0,
      count: counts[name],
    }));
  }, [posts]);

  const topContributors = useMemo(() => {
    const scores = {};
    posts.forEach(p => { 
      const likes = p.likes || 0;
      const reactionsCount = p.reactions ? Object.values(p.reactions).reduce((sum, count) => sum + count, 0) : 0;
      scores[p.username] = (scores[p.username] || 0) + likes + reactionsCount; 
    });
    return Object.entries(scores)
      .map(([name, score]) => ({ name, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [posts]);

  const dynamicTrends = useMemo(() => {
    const hashCounts = {};
    posts.forEach(p => {
      const matches = p.text.match(/#\w+/g);
      if (matches) matches.forEach(tag => {
        const t = tag.toLowerCase();
        hashCounts[t] = (hashCounts[t] || 0) + 1;
      });
    });
    return Object.entries(hashCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map(i => i.tag);
  }, [posts]);

  // ========== RENDER ==========
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 font-sans text-gray-800 relative overflow-hidden">

      {/* BACKGROUND FLOATING EMOJIS */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {backgroundEmojis.map((emoji, i) => (
          <div key={i}
            className={`absolute text-6xl opacity-20 animate-float ${i % 2 === 0 ? 'animation-delay-2000' : 'animation-delay-4000'}`}
            style={{ top: `${Math.random() * 80 + 10}%`, left: `${Math.random() * 80 + 10}%` }}>
            {emoji}
          </div>
        ))}
      </div>

      <PostModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onPost={addPost} 
        autoDeleteHours={autoDeleteHours}
      />

      <BugReportModal 
        isOpen={isBugModalOpen} 
        onClose={() => setIsBugModalOpen(false)} 
        initialMode={bugModalMode}
      />

      <div className="relative z-10">
        {/* FLOATING FEEDBACK BUTTONS */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 items-end">
          {/* Idea Button */}
          <button
            onClick={() => openBugModal('suggestion')}
            className="flex items-center gap-3 px-6 py-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-amber-100 text-amber-500 hover:bg-amber-50 hover:scale-105 transition-all group"
          >
            <span className="text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">Have an Idea?</span>
            <Lightbulb size={24} className="group-hover:rotate-12 transition-transform" />
          </button>

          {/* Bug Button */}
          <button
            onClick={() => openBugModal('bug')}
            className="flex items-center gap-3 px-6 py-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-red-100 text-red-500 hover:bg-red-50 hover:scale-105 transition-all group"
          >
            <span className="text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">Got a Bug?</span>
            <Bug size={24} className="group-hover:rotate-12 transition-transform" />
          </button>
        </div>

        <Header 
          openModal={() => setIsModalOpen(true)} 
          searchQuery={searchQuery} 
          setSearchQuery={handleSearchChange} 
        />

        {(activeTag || activeContributor) && (
          <div className="max-w-7xl mx-auto px-4 mt-4">
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-3 flex items-center justify-between border border-purple-100">
              <span className="text-sm text-purple-700 font-medium">
                Showing posts {activeTag ? `for ${activeTag}` : `by ${activeContributor}`}
              </span>
              <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-bold">Clear Filter ✕</button>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">

          <div className="hidden lg:block col-span-1 ml-[-250px] mr-[250px]">
            <LeftSidebar activeMood={activeMood} setActiveMood={handleMoodChange} moodData={moodData} />
          </div>

          <div className="col-span-1 lg:col-span-2 w-[700px] max-w-full mx-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-purple-300 border-t-purple-600 animate-spin" />
                <p className="text-gray-400 font-medium">Loading thoughts...</p>
              </div>
            ) : (
              <Feed
                posts={currentPosts}
                toggleLike={toggleLike}
                addComment={addComment}
                addReply={addReply}
                deleteComment={deleteComment}
                myCommentIds={myCommentIds}
                addReaction={addReaction}
                addCommentReaction={addCommentReaction}
                currentPage={currentPage}
                totalPages={totalPages}
                handlePageChange={(p) => setCurrentPage(p)}
                myPostIds={myPostIds}
                deletePost={handleDeletePost}
                onReportPost={handleReportPost}
                reportedPostIds={reportedPostIds}
              />
            )}
          </div>

          <div className="hidden lg:block col-span-1 ml-[250px] mr-[-250px]">
            <RightSidebar
              activeTag={activeTag}
              onTagClick={handleTagClick}
              activeContributor={activeContributor}
              onContributorClick={handleContributorClick}
              topContributors={topContributors}
              dynamicTrends={dynamicTrends}
            />
          </div>

        </div>
      </div>
    </div>
  );
}

export default Dashboard;