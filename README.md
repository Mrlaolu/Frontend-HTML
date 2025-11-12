# iCalligraphy 前端项目

使用基础 HTML + CSS + JavaScript 制作的 iCalligraphy 前端页面

## 项目结构

```
Frontend-HTML/
├── templates/          # HTML 模板文件
│   ├── index.html          # 首页
│   ├── auth.html           # 登录/注册页
│   ├── search.html         # 检索页面
│   ├── work_detail.html    # 作品详情
│   ├── work_upload.html    # 作品上传
│   ├── my_collections.html # 我的字集
│   ├── community.html      # 社区页面
│   ├── profile.html        # 个人中心
│   └── review_center.html  # 审核中心
│
├── static/             # 静态资源
│   ├── css/               # 样式文件
│   │   ├── main.css
│   │   ├── auth.css
│   │   ├── community.css
│   │   ├── my_collections.css
│   │   ├── work_upload.css
│   │   └── work_detail.css
│   │
│   └── js/                # JavaScript 文件
│       ├── main.js           # 主页交互
│       ├── auth.js           # 认证逻辑
│       ├── community.js      # 社区功能
│       ├── my_collections.js # 字集管理
│       ├── work_upload.js    # 作品上传
│       └── work_detail.js    # 作品详情
│
└── Docs/               # 前端文档
```

## 当前状态说明

### ⚠️ 重要提示：当前为静态原型阶段

本项目目前处于**前端静态原型阶段**，主要特点：

1. **静态数据展示**
   - HTML 中包含硬编码的示例数据
   - 用于展示界面效果和交互逻辑
   - 部分功能使用 LocalStorage 模拟数据存储

2. **后端 API 未接入**
   - JavaScript 中的 API 调用代码已编写但被注释
   - 后端 API 已开发完成（见 `../Backend/`）
   - 需要后续手动接入前后端

3. **独立运行方式**
   - 当前通过 Flask 渲染 HTML 模板
   - 可作为静态页面预览界面效果

## 如何接入后端 API

### 第一步：了解后端 API 结构

后端提供以下 API 端点（详见 `../Backend/README.md`）：

```
/api/auth          # 用户认证（登录、注册）
/api/works         # 作品管理（上传、查询、审核）
/api/users         # 用户管理（个人信息、关注）
/api/comments      # 评论管理
/api/collections   # 字集管理
```

### 第二步：启用 API 调用

在各个 JavaScript 文件中，找到被注释的 `fetch` API 调用代码并启用：

#### 示例 1：登录功能（`static/js/auth.js`）

**当前状态（第 252-272 行）：**
```javascript
// TODO: 实际项目中的 API 调用
// fetch('/api/auth/login', {
//   method: 'POST',
//   headers: { 'Content-Type': 'application/json' },
//   body: JSON.stringify({ username, password, remember })
// })
// .then(response => response.json())
// .then(data => {
//   if (data.success) {
//     showMessage('登录成功！', 'success');
//     localStorage.setItem('token', data.token);
//     localStorage.setItem('user', JSON.stringify(data.user));
//     setTimeout(() => {
//       window.location.href = '/';
//     }, 1000);
//   }
// })
```

**接入后端后：**
```javascript
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password, remember })
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    showMessage('登录成功！', 'success');
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  } else {
    showMessage(data.message || '登录失败', 'error');
  }
})
.catch(error => {
  showMessage('网络错误，请重试', 'error');
});
```

#### 示例 2：加载作品列表（需新增代码）

在 `static/js/main.js` 中新增：

```javascript
// 加载作品列表
async function loadWorks(page = 1, filters = {}) {
  try {
    const params = new URLSearchParams({
      page,
      limit: 12,
      ...filters
    });

    const response = await fetch(`/api/works?${params}`);
    const data = await response.json();

    if (data.success) {
      renderWorks(data.works);
      updatePagination(data.pagination);
    } else {
      console.error('加载作品失败:', data.message);
    }
  } catch (error) {
    console.error('网络错误:', error);
  }
}

// 渲染作品卡片
function renderWorks(works) {
  const container = document.querySelector('.works-grid');
  container.innerHTML = works.map(work => `
    <article class="work-card">
      <div class="thumb" style="background-image: url('${work.image_url}')"></div>
      <div class="work-info">
        <h4>${work.title}</h4>
        <p class="meta">作者：${work.author} · 风格：${work.style} · 字数：${work.char_count}</p>
      </div>
    </article>
  `).join('');
}
```

### 第三步：处理认证 Token

大多数 API 需要用户登录，需要在请求头中携带 JWT Token：

```javascript
// 创建通用的 API 请求函数
async function apiRequest(url, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  // 处理 401 未授权
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/auth';
    return;
  }

  return response.json();
}

// 使用示例
const data = await apiRequest('/api/works', {
  method: 'POST',
  body: JSON.stringify({ title: '新作品' })
});
```

### 第四步：替换静态数据

将 HTML 中的硬编码数据移除，改为动态加载：

**修改前（`templates/index.html`）：**
```html
<div class="works-grid">
  <article class="work-card">
    <div class="thumb"></div>
    <div class="work-info">
      <h4>兰亭集序</h4>
      <p class="meta">作者：王羲之 · 风格：行书 · 字数：324</p>
    </div>
  </article>
  <!-- 更多硬编码的作品卡片... -->
</div>
```

**修改后：**
```html
<div class="works-grid">
  <!-- 动态加载的内容将插入这里 -->
</div>

<script>
  // 页面加载时获取数据
  document.addEventListener('DOMContentLoaded', () => {
    loadWorks();
  });
</script>
```

### 第五步：测试接口联调

1. 启动后端服务：
```bash
cd Backend
python app.py
```

2. 访问前端页面：
```
http://localhost:5000
```

3. 检查浏览器控制台的网络请求是否正常

4. 确认数据是否正确显示

## 需要接入 API 的文件清单

以下文件包含被注释的 API 调用代码，需要逐一启用：

| 文件 | 功能 | 需要接入的 API |
|------|------|---------------|
| `static/js/auth.js` | 登录/注册 | `/api/auth/login`<br>`/api/auth/register`<br>`/api/auth/send-code` |
| `static/js/main.js` | 作品列表 | `/api/works` (GET) |
| `static/js/work_detail.js` | 作品详情 | `/api/works/{id}`<br>`/api/comments` |
| `static/js/work_upload.js` | 作品上传 | `/api/works` (POST) |
| `static/js/my_collections.js` | 字集管理 | `/api/collections` |
| `static/js/community.js` | 社区功能 | `/api/posts`（需后端新增） |

## 常见问题

### Q1: 跨域问题（CORS）
后端已配置 CORS，默认允许所有来源。生产环境需要在 `Backend/config.py` 中修改：

```python
CORS_ORIGINS = ['http://localhost:5000']  # 仅允许特定域名
```

### Q2: 文件上传
文件上传需要使用 `FormData`：

```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('title', '作品标题');

fetch('/api/works', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData  // 不要设置 Content-Type，浏览器会自动处理
});
```

### Q3: Token 过期处理
后端 Token 默认有效期为 24 小时，过期后需要重新登录。建议添加全局错误处理。

## 开发建议

1. **先接入认证模块**：登录/注册是其他功能的基础
2. **逐步接入功能**：建议按页面顺序逐个接入，便于调试
3. **添加加载状态**：API 请求时显示加载动画，提升用户体验
4. **错误处理**：完善错误提示，处理网络异常和业务错误
5. **数据验证**：前端也要做基本的数据验证，减轻后端压力

## 相关文档

- [后端 API 文档](../Backend/README.md)
- [前端页面规划](Docs/新项目规划前端页面与功能.md)
- [代码规范](Docs/代码规范.md)

## 技术栈

- **无框架**：使用原生 HTML/CSS/JavaScript
- **模板引擎**：Flask Jinja2（后端渲染 HTML）
- **HTTP 请求**：Fetch API
- **数据存储**：LocalStorage（临时存储 Token 和用户信息）

## License

MIT