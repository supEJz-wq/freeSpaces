import { supabase } from './supabase';

// ─── AUTO-DELETE THRESHOLD ───────────────────────────────────────────────────
const TEN_HOURS_MS = 10 * 60 * 60 * 1000;

// ─── POSTS ────────────────────────────────────────────────────────────────────

/** Fetch all non-expired posts with their nested comments */
export async function fetchPosts() {
  const tenHoursAgo = new Date(Date.now() - TEN_HOURS_MS).toISOString();

  const { data, error } = await supabase
    .from('posts')
    .select(`
      id, username, mood, text, likes, reactions, device_id, created_at,
      comments ( id, username, text, parent_id, created_at, reactions )
    `)
    .eq('is_deleted', false)
    .gte('created_at', tenHoursAgo)
    .order('created_at', { ascending: false });

  if (error) { console.error('fetchPosts:', error); return []; }

  // Normalize to the shape the UI expects
  return data.map(normalizePost);
}

/** Insert a new post */
export async function createPost({ username, mood, text, deviceId }) {
  const { data, error } = await supabase
    .from('posts')
    .insert([{ username, mood, text, device_id: deviceId, is_deleted: false, likes: 0, reactions: {} }])
    .select(`id, username, mood, text, likes, reactions, created_at, comments ( id, username, text, parent_id )`)
    .single();

  if (error) { console.error('createPost:', error); return null; }
  return normalizePost(data);
}

/** Get count of posts by device in the last 10 hours */
export async function getDevicePostCount(deviceId) {
  const tenHoursAgo = new Date(Date.now() - TEN_HOURS_MS).toISOString();
  const { count, error } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('device_id', deviceId)
    .gte('created_at', tenHoursAgo);
  
  if (error) { console.error('getDevicePostCount:', error); return 0; }
  return count || 0;
}

/** Purge all posts older than 10 hours */
export async function purgeExpiredPosts() {
  const { error } = await supabase.rpc('purge_expired_posts');
  if (error) console.error('purgeExpiredPosts:', error);
}

/** Delete a post by id (Soft Delete) */
export async function deletePost(id) {
  const { error } = await supabase.from('posts').update({ is_deleted: true }).eq('id', id);
  if (error) console.error('deletePost:', error);
}

/** Hard Delete all posts by a specific device (Developer Tool) */
export async function hardDeletePostsByDevice(deviceId) {
  const { error } = await supabase.from('posts').delete().eq('device_id', deviceId);
  if (error) console.error('hardDeletePostsByDevice:', error);
}

/** ========== IDENTITY MANAGEMENT ========== **/

/** Get the locked identity for a device */
export async function getIdentity(deviceId) {
  const { data, error } = await supabase
    .from('device_identities')
    .select('*')
    .eq('device_id', deviceId)
    .single();
  
  if (error && error.code !== 'PGRST116') console.error('getIdentity:', error);
  return data;
}

/** Lock a name to a device */
export async function lockIdentity(deviceId, username) {
  const { error } = await supabase
    .from('device_identities')
    .upsert({ device_id: deviceId, username });
  
  if (error) console.error('lockIdentity:', error);
}

/** Unlock/Reset a name for a device */
export async function resetIdentity(deviceId) {
  const { error } = await supabase
    .from('device_identities')
    .delete()
    .eq('device_id', deviceId);
  
  if (error) console.error('resetIdentity:', error);
}

/** Wipe EVERYTHING (Posts, Comments, Identities, Postcards) - Developer ONLY */
export async function hardResetDatabase() {
  const { error: err1 } = await supabase.from('posts').delete().neq('id', 0); // Delete all rows
  const { error: err2 } = await supabase.from('device_identities').delete().neq('created_at', '1970-01-01');
  const { error: err3 } = await supabase.from('postcards').delete().neq('id', 0);
  
  if (err1 || err2 || err3) console.error('hardResetDatabase errors:', err1, err2, err3);
}

/** Increment likes on a post */
export async function incrementLikes(id, currentLikes) {
  const { error } = await supabase
    .from('posts')
    .update({ likes: currentLikes + 1 })
    .eq('id', id);
  if (error) console.error('incrementLikes:', error);
}

/** Add or switch an emoji reaction on a post.
 *  emoji    = new emoji (or null to remove)
 *  prevEmoji = previously selected emoji (or null if first reaction)
 */
export async function addReactionDB(id, emoji, prevEmoji, currentReactions) {
  const updated = { ...currentReactions };

  // Increment new emoji
  if (emoji) {
    updated[emoji] = (updated[emoji] || 0) + 1;
  }

  // Decrement old emoji (min 0)
  if (prevEmoji && updated[prevEmoji] !== undefined) {
    updated[prevEmoji] = Math.max(0, (updated[prevEmoji] || 0) - 1);
  }

  const { error } = await supabase
    .from('posts')
    .update({ reactions: updated })
    .eq('id', id);
  if (error) console.error('addReaction:', error);
  return updated;
}

// ─── COMMENTS ────────────────────────────────────────────────────────────────

/** Add a comment to a post */
export async function addCommentDB(postId, username, text) {
  const { data, error } = await supabase
    .from('comments')
    .insert([{ post_id: postId, username, text }])
    .select('id, username, text, parent_id, reactions')
    .single();

  if (error) { console.error('addComment:', error); return null; }
  return normalizeComment(data);
}

/** Add a reply to a comment */
export async function addReplyDB(postId, parentId, username, text) {
  const { data, error } = await supabase
    .from('comments')
    .insert([{ post_id: postId, parent_id: parentId, username, text }])
    .select('id, username, text, parent_id, reactions')
    .single();

  if (error) { console.error('addReply:', error); return null; }
  return normalizeComment(data);
}

/** Delete a comment (replies cascade in the database) */
export async function deleteCommentDB(commentId) {
  const { error } = await supabase.from('comments').delete().eq('id', commentId);
  if (error) { console.error('deleteComment:', error); return false; }
  return true;
}

// ─── REPORTED POSTS ───────────────────────────────────────────────────────────

/** Fetch all reported post ids */
export async function fetchReportedIds() {
  const { data, error } = await supabase.from('reported_posts').select('post_id');
  if (error) { console.error('fetchReportedIds:', error); return []; }
  return data.map(r => r.post_id);
}

/** Report a post */
export async function reportPost(postId) {
  const { error } = await supabase.from('reported_posts').upsert([{ post_id: postId }]);
  if (error) console.error('reportPost:', error);
}

/** Un-report a post */
export async function unreportPost(postId) {
  const { error } = await supabase.from('reported_posts').delete().eq('post_id', postId);
  if (error) console.error('unreportPost:', error);
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────

/** Fetch all settings */
export async function fetchSettings() {
  const { data, error } = await supabase.from('settings').select('key, value');
  if (error) { console.error('fetchSettings:', error); return {}; }
  return Object.fromEntries(data.map(r => [r.key, r.value]));
}

/** Update a setting by key */
export async function updateSetting(key, value) {
  const { error } = await supabase
    .from('settings')
    .upsert({ key, value });
  if (error) console.error('updateSetting:', error);
}

// ─── BUG REPORTS ─────────────────────────────────────────────────────────────

/** Submit a new bug report or feedback */
export async function createBugReport({ text, reporterName, deviceId, type = 'bug', imageFile = null }) {
  let imageUrl = null;

  if (imageFile) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${deviceId}-${Date.now()}.${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('bug_reports')
      .upload(fileName, imageFile);

    if (uploadError) {
      console.error('Image upload failed:', uploadError);
    } else {
      const { data: publicUrlData } = supabase.storage
        .from('bug_reports')
        .getPublicUrl(fileName);
      imageUrl = publicUrlData.publicUrl;
    }
  }

  const { data, error } = await supabase
    .from('bug_reports')
    .insert([{ 
      text, 
      reporter_name: reporterName, 
      device_id: deviceId,
      type,
      image_url: imageUrl
    }])
    .select()
    .single();

  if (error) { 
    console.error('createBugReport:', error); 
    return null; 
  }
  return data;
}

/** Fetch all bug reports and user ideas (newest first) */
export async function fetchBugReports() {
  const { data, error } = await supabase
    .from('bug_reports')
    .select('id, text, reporter_name, device_id, type, created_at, image_url')
    .order('created_at', { ascending: false });

  if (error) { console.error('fetchBugReports:', error); return []; }
  return data.map(normalizeBugReport);
}

/** Delete a bug report or idea by id */
export async function deleteBugReport(id) {
  const { error } = await supabase.from('bug_reports').delete().eq('id', id);
  if (error) console.error('deleteBugReport:', error);
}

/** Delete multiple bug reports or ideas by id */
export async function deleteBugReports(ids) {
  if (!ids.length) return;
  const { error } = await supabase.from('bug_reports').delete().in('id', ids);
  if (error) console.error('deleteBugReports:', error);
}

// ─── HELPER ───────────────────────────────────────────────────────────────────

function normalizeComment(comment) {
  return {
    id: comment.id,
    username: comment.username,
    text: comment.text,
    parentId: comment.parent_id ?? null,
    reactions: comment.reactions ?? {},
    replies: [],
  };
}

/** Add or switch an emoji reaction on a comment.
 *  emoji     = new emoji (or null to remove)
 *  prevEmoji = previously selected emoji (or null)
 */
export async function addCommentReactionDB(commentId, emoji, prevEmoji, currentReactions) {
  const updated = { ...currentReactions };

  if (emoji) {
    updated[emoji] = (updated[emoji] || 0) + 1;
  }
  if (prevEmoji && updated[prevEmoji] !== undefined) {
    updated[prevEmoji] = Math.max(0, (updated[prevEmoji] || 0) - 1);
  }

  const { error } = await supabase
    .from('comments')
    .update({ reactions: updated })
    .eq('id', commentId);
  if (error) console.error('addCommentReaction:', error);
  return updated;
}

function nestComments(comments) {
  const normalized = (comments ?? []).map(normalizeComment);
  const byId = Object.fromEntries(normalized.map(c => [c.id, c]));
  const roots = [];

  normalized.forEach(comment => {
    if (comment.parentId && byId[comment.parentId]) {
      byId[comment.parentId].replies.push(comment);
    } else if (!comment.parentId) {
      roots.push(comment);
    }
  });

  return roots;
}

function normalizePost(post) {
  return {
    id: post.id,
    username: post.username,
    mood: post.mood,
    text: post.text,
    likes: post.likes ?? 0,
    reactions: post.reactions ?? {},
    createdAt: new Date(post.created_at).getTime(),
    comments: nestComments(post.comments),
  };
}

function normalizeBugReport(report) {
  return {
    id: report.id,
    text: report.text,
    reporterName: report.reporter_name,
    deviceId: report.device_id,
    type: report.type,
    imageUrl: report.image_url,
    createdAt: new Date(report.created_at).getTime(),
  };
}

// ─── POSTCARDS ───────────────────────────────────────────────────────────────

/** Share a postcard to the public wall */
export async function sharePostcardDB({ to, from, message, bgType, bgColor, bgGradient, textColor, font, align, stickers, borderStyle, deviceId }) {
  // 1. Check rate limit
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from('postcards')
    .select('*', { count: 'exact', head: true })
    .eq('device_id', deviceId)
    .gte('created_at', yesterday);

  if (countError) {
    console.error('Check limit error:', countError);
    return { error: 'Unknown error' };
  }

  if (count >= 5) {
    return { error: 'LIMIT_REACHED' };
  }

  // 2. Insert if under limit
  const { data, error } = await supabase
    .from('postcards')
    .insert([{
      to,
      from,
      message,
      bg_type: bgType,
      bg_color: bgColor,
      bg_gradient: bgGradient,
      text_color: textColor,
      font,
      align,
      stickers: stickers || [],
      border_style: borderStyle,
      device_id: deviceId, // Store device ID
    }])
    .select()
    .single();

  if (error) { 
    console.error('sharePostcard:', error); 
    return { error: 'Failed to insert' }; 
  }
  return { data };
}

/** Fetch all postcards (newest first) */
export async function fetchPostcards() {
  const { data, error } = await supabase
    .from('postcards')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) { console.error('fetchPostcards:', error); return []; }
  return data.map(p => ({
    id: p.id,
    to: p.to,
    from: p.from,
    message: p.message,
    bgType: p.bg_type,
    bgColor: p.bg_color,
    bgGradient: p.bg_gradient,
    textColor: p.text_color,
    font: p.font,
    align: p.align,
    stickers: p.stickers || [],
    borderStyle: p.border_style,
    createdAt: new Date(p.created_at).getTime(),
  }));
}

/** Delete a single postcard */
export async function deletePostcard(id) {
  const { error } = await supabase.from('postcards').delete().eq('id', id);
  if (error) console.error('deletePostcard:', error);
}

/** Delete multiple postcards */
export async function deletePostcards(ids) {
  const { error } = await supabase.from('postcards').delete().in('id', ids);
  if (error) console.error('deletePostcards:', error);
}

