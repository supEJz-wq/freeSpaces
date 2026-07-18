import React from 'react';
import PostCard from './PostCard';
import Pagination from './Pagination';

const Feed = ({ posts, toggleLike, addComment, addReply, deleteComment, myCommentIds, addReaction, addCommentReaction, currentPage, totalPages, handlePageChange, myPostIds, deletePost, onReportPost, reportedPostIds }) => {
  return (
    // Main Feed Container with fade-in animation on page change
    <div key={currentPage} className="animate-fadeInUp space-y-5">
      
      {/* CONDITIONAL RENDERING: Check if there are posts to display */}
      {posts.length > 0 ? (
        <>
        
          {/* ========== POST CARDS LIST ========== */}
          {posts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              toggleLike={toggleLike} 
              addComment={addComment}
              addReply={addReply}
              deleteComment={deleteComment}
              myCommentIds={myCommentIds}
              addReaction={addReaction}
              addCommentReaction={addCommentReaction}
              isMyPost={myPostIds.includes(post.id)} // Determines if delete button shows
              deletePost={deletePost}                 // Function to delete the post
              onReportPost={onReportPost}             // NEW: Function to report the post
              isReported={reportedPostIds.includes(post.id)} // NEW: True/False if already reported
            />
          ))}
          
          {/* ========== PAGINATION BUTTONS (1, 2, 3...) ========== */}
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            handlePageChange={handlePageChange} 
          />
          
        </>
      ) : (
        
        /* ========== EMPTY STATE (No Posts Found) ========== */
        <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-10 shadow-sm border border-white/50 text-center">
          <p className="text-5xl mb-3">🔍</p>
          <p className="text-gray-500 font-medium text-lg">No thoughts found.</p>
          <p className="text-gray-400 text-sm mt-2">Try a different mood or search term.</p>
        </div>
        
      )}
    </div>
  );
};

export default Feed;