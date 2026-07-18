import React from 'react';
import { FileText, Heart, Wifi } from 'lucide-react'; // Changed Users to Wifi

const AdminStats = ({ posts, onlineUsers, isDarkMode }) => {
  const totalPosts = posts.length;
  const totalLikes = posts.reduce((acc, post) => acc + post.likes, 0);

  const stats = [
    { title: "Total Posts", value: totalPosts, icon: FileText, color: isDarkMode ? "text-blue-400" : "text-blue-600", bgColor: isDarkMode ? "bg-blue-400/10" : "bg-blue-100" },
    { title: "Online Now", value: onlineUsers, icon: Wifi, color: isDarkMode ? "text-green-400" : "text-green-600", bgColor: isDarkMode ? "bg-green-400/10" : "bg-green-100" },
    { title: "Total Likes", value: totalLikes, icon: Heart, color: isDarkMode ? "text-rose-400" : "text-rose-600", bgColor: isDarkMode ? "bg-rose-400/10" : "bg-rose-100" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, i) => (
        <div key={i} className={`p-6 rounded-2xl flex items-center gap-4 transition-colors duration-300 border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-300 shadow-sm'}`}>
          <div className={`p-3 rounded-xl ${stat.bgColor} ${stat.color}`}>
            <stat.icon size={24} />
          </div>
          <div>
            <p className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{stat.title}</p>
            {/* Added transition to make the number changing look smooth */}
            <p className={`text-2xl font-bold transition-all duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminStats;