/**
 * 社区页面交互脚本
 * 包含每日打卡、发帖、评论点赞等功能
 */

// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', function() {
  // 初始化所有功能
  initCheckin();
  initPostComposer();
  initPostFilters();
  initPostActions();
  initComments();
});

/**
 * 初始化每日打卡功能
 */
function initCheckin() {
  const checkinBtn = document.getElementById('checkinBtn');
  const checkinStatus = document.getElementById('checkinStatus');
  const streakDays = document.getElementById('streakDays');
  const calendarDays = document.getElementById('calendarDays');

  // 从本地存储读取打卡数据
  let checkinData = JSON.parse(localStorage.getItem('checkinData') || '{"streak": 0, "dates": []}');

  // 更新连续天数显示
  streakDays.textContent = checkinData.streak;

  // 生成日历（显示最近14天）
  generateCalendar(calendarDays, checkinData.dates);

  // 检查今天是否已打卡
  const today = new Date().toDateString();
  const hasCheckedToday = checkinData.dates.includes(today);

  if (hasCheckedToday) {
    checkinBtn.disabled = true;
    checkinBtn.textContent = '今日已打卡';
    checkinBtn.classList.add('checked');
    checkinStatus.textContent = '✓ 今日已完成打卡';
  }

  // 打卡按钮点击事件
  checkinBtn.addEventListener('click', function() {
    if (hasCheckedToday) return;

    // 更新打卡数据
    checkinData.dates.push(today);
    checkinData.streak++;

    // 保存到本地存储
    localStorage.setItem('checkinData', JSON.stringify(checkinData));

    // 更新UI
    streakDays.textContent = checkinData.streak;
    checkinBtn.disabled = true;
    checkinBtn.innerHTML = '<span class="btn-text">今日已打卡</span>';
    checkinBtn.classList.add('checked');
    checkinStatus.textContent = '✓ 打卡成功！继续保持！';

    // 重新生成日历
    generateCalendar(calendarDays, checkinData.dates);

    // 显示祝贺动画
    showCheckinAnimation();
  });
}

/**
 * 生成打卡日历
 */
function generateCalendar(container, checkedDates) {
  container.innerHTML = '';
  const today = new Date();

  // 生成最近14天的日历
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    dayDiv.textContent = date.getDate();

    // 检查是否已打卡
    if (checkedDates.includes(date.toDateString())) {
      dayDiv.classList.add('checked');
      dayDiv.textContent = '✓';
    }

    // 标记今天
    if (i === 0) {
      dayDiv.classList.add('today');
    }

    container.appendChild(dayDiv);
  }
}

/**
 * 打卡成功动画
 */
function showCheckinAnimation() {
  const status = document.getElementById('checkinStatus');
  status.style.animation = 'fadeIn 0.5s ease';
}

/**
 * 初始化发帖功能
 */
function initPostComposer() {
  const postContent = document.getElementById('postContent');
  const charCount = document.getElementById('charCount');
  const publishBtn = document.getElementById('publishBtn');

  // 字数统计
  postContent.addEventListener('input', function() {
    const length = this.value.length;
    charCount.textContent = length;

    if (length > 1900) {
      charCount.style.color = '#d32f2f';
    } else {
      charCount.style.color = 'inherit';
    }
  });

  // 发布按钮
  publishBtn.addEventListener('click', function() {
    const title = document.getElementById('postTitle').value.trim();
    const content = postContent.value.trim();

    if (!content) {
      alert('请输入帖子内容');
      return;
    }

    // 创建新帖子（实际应用中应该发送到服务器）
    const newPost = createPostElement({
      author: '我',
      avatar: '我',
      time: '刚刚',
      title: title,
      content: content,
      likes: 0,
      comments: 0
    });

    // 插入到帖子列表顶部
    const postsList = document.getElementById('postsList');
    postsList.insertBefore(newPost, postsList.firstChild);

    // 清空输入框
    document.getElementById('postTitle').value = '';
    postContent.value = '';
    charCount.textContent = '0';

    // 显示成功提示
    alert('发布成功！');
  });
}

/**
 * 创建帖子元素
 */
function createPostElement(data) {
  const article = document.createElement('article');
  article.className = 'post-card';

  article.innerHTML = `
    <div class="post-header">
      <div class="post-author">
        <div class="author-avatar">${data.avatar}</div>
        <div class="author-info">
          <h4 class="author-name">${data.author}</h4>
          <p class="post-time">${data.time}</p>
        </div>
      </div>
      <button type="button" class="post-menu-btn" aria-label="更多操作">⋯</button>
    </div>
    <div class="post-body">
      ${data.title ? `<h3 class="post-title">${data.title}</h3>` : ''}
      <p class="post-content">${data.content}</p>
    </div>
    <div class="post-footer">
      <button type="button" class="post-action" data-action="like">
        <span class="action-icon">👍</span>
        <span class="action-count">${data.likes}</span>
      </button>
      <button type="button" class="post-action" data-action="comment">
        <span class="action-icon">💬</span>
        <span class="action-count">${data.comments}</span>
      </button>
      <button type="button" class="post-action" data-action="share">
        <span class="action-icon">↗</span>
        <span class="action-text">分享</span>
      </button>
    </div>
    <div class="comments-section hidden">
      <div class="comment-composer">
        <input type="text" class="comment-input" placeholder="写下你的评论..." />
        <button type="button" class="btn btn-small">发送</button>
      </div>
      <div class="comments-list"></div>
    </div>
  `;

  // 绑定事件
  bindPostActions(article);

  return article;
}

/**
 * 初始化帖子筛选
 */
function initPostFilters() {
  const filterTabs = document.querySelectorAll('.filter-tab');
  const searchInput = document.getElementById('postSearch');

  // 筛选标签切换
  filterTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      filterTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');

      const filter = this.dataset.filter;
      filterPosts(filter);
    });
  });

  // 搜索功能
  searchInput.addEventListener('input', function() {
    const keyword = this.value.toLowerCase().trim();
    searchPosts(keyword);
  });
}

/**
 * 筛选帖子
 */
function filterPosts(filter) {
  const posts = document.querySelectorAll('.post-card');

  // 示例：实际应用中应该根据真实数据进行筛选
  console.log('筛选模式:', filter);

  // 这里可以实现不同的筛选逻辑
  // 例如：按热度、时间、关注等排序
}

/**
 * 搜索帖子
 */
function searchPosts(keyword) {
  if (!keyword) {
    // 显示所有帖子
    document.querySelectorAll('.post-card').forEach(post => {
      post.style.display = '';
    });
    return;
  }

  document.querySelectorAll('.post-card').forEach(post => {
    const title = post.querySelector('.post-title')?.textContent.toLowerCase() || '';
    const content = post.querySelector('.post-content').textContent.toLowerCase();
    const author = post.querySelector('.author-name').textContent.toLowerCase();

    if (title.includes(keyword) || content.includes(keyword) || author.includes(keyword)) {
      post.style.display = '';
    } else {
      post.style.display = 'none';
    }
  });
}

/**
 * 初始化帖子操作
 */
function initPostActions() {
  const posts = document.querySelectorAll('.post-card');
  posts.forEach(post => bindPostActions(post));
}

/**
 * 绑定帖子操作事件
 */
function bindPostActions(post) {
  const actions = post.querySelectorAll('.post-action');

  actions.forEach(action => {
    action.addEventListener('click', function() {
      const actionType = this.dataset.action;

      if (actionType === 'like') {
        handleLike(this);
      } else if (actionType === 'comment') {
        handleCommentToggle(this);
      } else if (actionType === 'share') {
        handleShare(this);
      }
    });
  });
}

/**
 * 处理点赞
 */
function handleLike(button) {
  const countSpan = button.querySelector('.action-count');
  let count = parseInt(countSpan.textContent);

  // 切换点赞状态
  if (button.classList.contains('liked')) {
    button.classList.remove('liked');
    count--;
  } else {
    button.classList.add('liked');
    count++;
  }

  countSpan.textContent = count;
}

/**
 * 处理评论区显示/隐藏
 */
function handleCommentToggle(button) {
  const post = button.closest('.post-card');
  const commentsSection = post.querySelector('.comments-section');

  commentsSection.classList.toggle('hidden');
}

/**
 * 处理分享
 */
function handleShare(button) {
  const post = button.closest('.post-card');
  const title = post.querySelector('.post-title')?.textContent || '书法社区帖子';

  // 简单的分享功能（实际应用中可以使用更完善的分享API）
  if (navigator.share) {
    navigator.share({
      title: title,
      text: '来自 iCalligraphy 书法社区',
      url: window.location.href
    }).catch(err => console.log('分享失败:', err));
  } else {
    alert('已复制链接到剪贴板');
    // 实际应该复制链接到剪贴板
  }
}

/**
 * 初始化评论功能
 */
function initComments() {
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-small') &&
        e.target.closest('.comment-composer')) {
      handleCommentSubmit(e.target);
    }

    if (e.target.closest('.comment-like')) {
      handleCommentLike(e.target.closest('.comment-like'));
    }
  });
}

/**
 * 处理评论提交
 */
function handleCommentSubmit(button) {
  const composer = button.closest('.comment-composer');
  const input = composer.querySelector('.comment-input');
  const content = input.value.trim();

  if (!content) {
    alert('请输入评论内容');
    return;
  }

  // 创建评论元素
  const commentsList = composer.nextElementSibling;
  const comment = createCommentElement({
    author: '我',
    avatar: '我',
    time: '刚刚',
    content: content,
    likes: 0
  });

  commentsList.appendChild(comment);

  // 清空输入框
  input.value = '';

  // 更新评论数
  const post = button.closest('.post-card');
  const commentBtn = post.querySelector('[data-action="comment"]');
  const countSpan = commentBtn.querySelector('.action-count');
  countSpan.textContent = parseInt(countSpan.textContent) + 1;
}

/**
 * 创建评论元素
 */
function createCommentElement(data) {
  const div = document.createElement('div');
  div.className = 'comment-item';

  div.innerHTML = `
    <div class="comment-avatar">${data.avatar}</div>
    <div class="comment-body">
      <div class="comment-header">
        <span class="comment-author">${data.author}</span>
        <span class="comment-time">${data.time}</span>
      </div>
      <p class="comment-text">${data.content}</p>
      <button type="button" class="comment-like">
        <span class="action-icon">👍</span>
        <span class="action-count">${data.likes}</span>
      </button>
    </div>
  `;

  return div;
}

/**
 * 处理评论点赞
 */
function handleCommentLike(button) {
  const countSpan = button.querySelector('.action-count');
  let count = parseInt(countSpan.textContent);

  if (button.classList.contains('liked')) {
    button.classList.remove('liked');
    count--;
  } else {
    button.classList.add('liked');
    count++;
  }

  countSpan.textContent = count;
}

/**
 * 加载更多帖子
 */
const loadMoreBtn = document.getElementById('loadMoreBtn');
if (loadMoreBtn) {
  loadMoreBtn.addEventListener('click', function() {
    // 实际应用中应该从服务器加载更多数据
    console.log('加载更多帖子...');
    this.textContent = '加载中...';

    setTimeout(() => {
      this.textContent = '加载更多';
      alert('没有更多帖子了');
    }, 1000);
  });
}
