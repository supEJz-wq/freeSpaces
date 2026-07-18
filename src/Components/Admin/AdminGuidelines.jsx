import React from 'react';
import { Book, Shield, AlertTriangle, Trash2, Zap, Search, Clock } from 'lucide-react';

const AdminGuidelines = ({ isDarkMode }) => {
  const cardBg = isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm';
  const textTitle = isDarkMode ? 'text-rose-400' : 'text-rose-600';
  const textBody = isDarkMode ? 'text-gray-400' : 'text-gray-600';

  const sections = [
    {
      title: "Content Moderation 🛡️",
      icon: <Shield className="text-blue-500" />,
      content: "Use the Moderation Table to review all posts. You can search by username or keywords, filter by 'Reported' status, or filter by time to see recent activity."
    },
    {
      title: "Reporting Queue ⚠️",
      icon: <AlertTriangle className="text-orange-500" />,
      content: "Posts reported by community members appear in the 'Reported' tab. Review them carefully: you can 'Approve' to clear the report or 'Delete' to remove the post."
    },
    {
      title: "User Management 👤",
      icon: <Zap className="text-purple-500" />,
      content: "The 'RESET' button unlocks a user's name and clears their post history. Use this if a user wants to change their identity or if they hit the 3-post rate limit erroneously."
    },
    {
      title: "Word Blacklist 🚫",
      icon: <Book className="text-red-500" />,
      content: "Add words to the blacklist to prevent them from being used in Usernames. This helps keep the community clean and professional."
    },
    {
      title: "Purge vs Nuclear Reset ☢️",
      icon: <Trash2 className="text-rose-500" />,
      content: "'Purge Expired' cleans up posts older than 10h. 'Nuclear Reset' wipes EVERY post and EVERY name lock in the whole system. Use with caution!"
    },
    {
      title: "Real-time Updates ⚡",
      icon: <Clock className="text-green-500" />,
      content: "The dashboard updates in real-time. If a new post or report comes in, it will appear automatically without needing to refresh the page."
    }
  ];

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-2xl border ${cardBg}`}>
        <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${textTitle}`}>
          <Book size={24} /> Administrator Guidelines
        </h2>
        <p className={`text-sm mb-8 ${textBody}`}>
          Welcome to the FreeSpace Command Center. Follow these guidelines to maintain a healthy and safe anonymous environment for everyone.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((s, i) => (
            <div key={i} className={`p-4 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-center gap-3 mb-2">
                {s.icon}
                <h3 className="font-bold text-sm tracking-wide">{s.title}</h3>
              </div>
              <p className={`text-xs leading-relaxed ${textBody}`}>{s.content}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className={`p-4 rounded-xl border border-dashed text-center ${isDarkMode ? 'border-white/10 text-gray-500' : 'border-gray-300 text-gray-400'}`}>
        <p className="text-xs italic">"Anonymous freedom is a privilege, not a right. Moderate with fairness."</p>
      </div>
    </div>
  );
};

export default AdminGuidelines;
