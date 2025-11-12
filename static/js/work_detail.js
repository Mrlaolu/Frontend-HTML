/**
 * 作品详情页面交互脚本
 * 包含图片缩放、拖拽、单字悬停、评论等功能
 */

// 全局状态
const viewerState = {
  canvas: null,
  ctx: null,
  image: null,
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  showCharBoxes: true,
  charBoxes: [] // 示例单字框数据
};

// DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
  initViewer();
  initToolbar();
  initCharBoxes();
  initActions();
  initComments();
  loadMockData();
});

/**
 * 初始化查看器
 */
function initViewer() {
  viewerState.canvas = document.getElementById('workCanvas');
  viewerState.ctx = viewerState.canvas.getContext('2d');
  const container = document.getElementById('canvasContainer');

  // 设置画布大小
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // 加载示例图片
  loadWorkImage();

  // 拖拽功能
  container.addEventListener('mousedown', startDrag);
  container.addEventListener('mousemove', drag);
  container.addEventListener('mouseup', endDrag);
  container.addEventListener('mouseleave', endDrag);

  // 滚轮缩放
  container.addEventListener('wheel', handleWheel, { passive: false });

  // 键盘快捷键
  document.addEventListener('keydown', handleKeyboard);
}

/**
 * 调整画布大小
 */
function resizeCanvas() {
  const container = document.getElementById('canvasContainer');
  viewerState.canvas.width = container.clientWidth;
  viewerState.canvas.height = container.clientHeight;
  redrawCanvas();
}

/**
 * 加载作品图片
 */
function loadWorkImage() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  loadingOverlay.classList.remove('hidden');

  // 创建示例图片（实际应用中从服务器加载）
  viewerState.image = new Image();
  viewerState.image.onload = function() {
    loadingOverlay.classList.add('hidden');

    // 自适应初始缩放
    const scaleX = viewerState.canvas.width / viewerState.image.width;
    const scaleY = viewerState.canvas.height / viewerState.image.height;
    viewerState.scale = Math.min(scaleX, scaleY, 1) * 0.9;

    // 居中
    viewerState.offsetX = (viewerState.canvas.width - viewerState.image.width * viewerState.scale) / 2;
    viewerState.offsetY = (viewerState.canvas.height - viewerState.image.height * viewerState.scale) / 2;

    redrawCanvas();
    updateZoomDisplay();
  };

  // 使用示例图片URL（实际应用中替换为真实数据）
  // 这里使用一个纯色矩形模拟
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 800;
  tempCanvas.height = 1200;
  const tempCtx = tempCanvas.getContext('2d');

  // 绘制宣纸背景
  tempCtx.fillStyle = '#f5f5dc';
  tempCtx.fillRect(0, 0, 800, 1200);

  // 绘制示例文字
  tempCtx.fillStyle = '#333';
  tempCtx.font = 'bold 48px serif';
  tempCtx.textAlign = 'center';
  tempCtx.fillText('兰亭集序', 400, 100);
  tempCtx.font = '32px serif';
  tempCtx.fillText('王羲之', 400, 160);

  viewerState.image.src = tempCanvas.toDataURL();
}

/**
 * 重绘画布
 */
function redrawCanvas() {
  if (!viewerState.image || !viewerState.image.complete) return;

  const ctx = viewerState.ctx;
  const canvas = viewerState.canvas;

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 绘制图片
  ctx.save();
  ctx.translate(viewerState.offsetX, viewerState.offsetY);
  ctx.scale(viewerState.scale, viewerState.scale);
  ctx.drawImage(viewerState.image, 0, 0);
  ctx.restore();

  // 绘制单字框
  if (viewerState.showCharBoxes) {
    drawCharBoxes();
  }
}

/**
 * 绘制单字框
 */
function drawCharBoxes() {
  const ctx = viewerState.ctx;
  ctx.strokeStyle = 'rgba(139, 69, 19, 0.7)';
  ctx.lineWidth = 2;

  viewerState.charBoxes.forEach(box => {
    const x = viewerState.offsetX + box.x * viewerState.scale;
    const y = viewerState.offsetY + box.y * viewerState.scale;
    const w = box.width * viewerState.scale;
    const h = box.height * viewerState.scale;

    ctx.strokeRect(x, y, w, h);
  });
}

/**
 * 拖拽开始
 */
function startDrag(e) {
  viewerState.isDragging = true;
  viewerState.dragStartX = e.clientX - viewerState.offsetX;
  viewerState.dragStartY = e.clientY - viewerState.offsetY;
  document.getElementById('canvasContainer').classList.add('dragging');
}

/**
 * 拖拽中
 */
function drag(e) {
  if (!viewerState.isDragging) return;

  viewerState.offsetX = e.clientX - viewerState.dragStartX;
  viewerState.offsetY = e.clientY - viewerState.dragStartY;

  redrawCanvas();
  updateCharBoxesLayer();
}

/**
 * 拖拽结束
 */
function endDrag() {
  viewerState.isDragging = false;
  document.getElementById('canvasContainer').classList.remove('dragging');
}

/**
 * 滚轮缩放
 */
function handleWheel(e) {
  e.preventDefault();

  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  const newScale = viewerState.scale * delta;

  // 限制缩放范围
  if (newScale < 0.1 || newScale > 10) return;

  // 以鼠标位置为中心缩放
  const rect = viewerState.canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  viewerState.offsetX = mouseX - (mouseX - viewerState.offsetX) * delta;
  viewerState.offsetY = mouseY - (mouseY - viewerState.offsetY) * delta;
  viewerState.scale = newScale;

  redrawCanvas();
  updateZoomDisplay();
  updateCharBoxesLayer();
}

/**
 * 键盘快捷键
 */
function handleKeyboard(e) {
  if (e.ctrlKey || e.metaKey) {
    switch(e.key) {
      case '+':
      case '=':
        e.preventDefault();
        zoomIn();
        break;
      case '-':
        e.preventDefault();
        zoomOut();
        break;
      case '0':
        e.preventDefault();
        resetZoom();
        break;
    }
  }

  if (e.key === 'F11') {
    e.preventDefault();
    toggleFullscreen();
  }
}

/**
 * 初始化工具栏
 */
function initToolbar() {
  // 缩放按钮
  document.getElementById('zoomInBtn').addEventListener('click', zoomIn);
  document.getElementById('zoomOutBtn').addEventListener('click', zoomOut);
  document.getElementById('resetZoomBtn').addEventListener('click', resetZoom);

  // 适应按钮
  document.getElementById('fitWidthBtn').addEventListener('click', fitWidth);
  document.getElementById('fitHeightBtn').addEventListener('click', fitHeight);

  // 全屏按钮
  document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);

  // 显示单字框开关
  document.getElementById('showCharBoxes').addEventListener('change', function() {
    viewerState.showCharBoxes = this.checked;
    redrawCanvas();
    updateCharBoxesLayer();
  });
}

/**
 * 放大
 */
function zoomIn() {
  changeZoom(1.2);
}

/**
 * 缩小
 */
function zoomOut() {
  changeZoom(0.8);
}

/**
 * 重置缩放
 */
function resetZoom() {
  if (!viewerState.image) return;

  const scaleX = viewerState.canvas.width / viewerState.image.width;
  const scaleY = viewerState.canvas.height / viewerState.image.height;
  viewerState.scale = Math.min(scaleX, scaleY, 1) * 0.9;

  viewerState.offsetX = (viewerState.canvas.width - viewerState.image.width * viewerState.scale) / 2;
  viewerState.offsetY = (viewerState.canvas.height - viewerState.image.height * viewerState.scale) / 2;

  redrawCanvas();
  updateZoomDisplay();
  updateCharBoxesLayer();
}

/**
 * 适应宽度
 */
function fitWidth() {
  if (!viewerState.image) return;

  viewerState.scale = viewerState.canvas.width / viewerState.image.width * 0.95;
  viewerState.offsetX = (viewerState.canvas.width - viewerState.image.width * viewerState.scale) / 2;
  viewerState.offsetY = 20;

  redrawCanvas();
  updateZoomDisplay();
  updateCharBoxesLayer();
}

/**
 * 适应高度
 */
function fitHeight() {
  if (!viewerState.image) return;

  viewerState.scale = viewerState.canvas.height / viewerState.image.height * 0.95;
  viewerState.offsetX = 20;
  viewerState.offsetY = (viewerState.canvas.height - viewerState.image.height * viewerState.scale) / 2;

  redrawCanvas();
  updateZoomDisplay();
  updateCharBoxesLayer();
}

/**
 * 切换全屏
 */
function toggleFullscreen() {
  const container = document.querySelector('.work-viewer');

  if (!document.fullscreenElement) {
    container.requestFullscreen().catch(err => {
      console.error('无法进入全屏模式:', err);
    });
  } else {
    document.exitFullscreen();
  }
}

/**
 * 改变缩放
 */
function changeZoom(factor) {
  const newScale = viewerState.scale * factor;

  if (newScale < 0.1 || newScale > 10) return;

  // 以画布中心为缩放中心
  const centerX = viewerState.canvas.width / 2;
  const centerY = viewerState.canvas.height / 2;

  viewerState.offsetX = centerX - (centerX - viewerState.offsetX) * factor;
  viewerState.offsetY = centerY - (centerY - viewerState.offsetY) * factor;
  viewerState.scale = newScale;

  redrawCanvas();
  updateZoomDisplay();
  updateCharBoxesLayer();
}

/**
 * 更新缩放显示
 */
function updateZoomDisplay() {
  const percent = Math.round(viewerState.scale * 100);
  document.getElementById('zoomLevel').textContent = `${percent}%`;
}

/**
 * 初始化单字框
 */
function initCharBoxes() {
  // 生成示例单字框数据
  viewerState.charBoxes = [
    { x: 300, y: 200, width: 60, height: 80, char: '永', index: 0 },
    { x: 380, y: 200, width: 60, height: 80, char: '和', index: 1 },
    { x: 460, y: 200, width: 60, height: 80, char: '岁', index: 2 },
    { x: 300, y: 300, width: 60, height: 80, char: '在', index: 3 },
    { x: 380, y: 300, width: 60, height: 80, char: '癸', index: 4 },
    { x: 460, y: 300, width: 60, height: 80, char: '丑', index: 5 }
  ];

  updateCharBoxesLayer();

  // 单字搜索
  const charSearchInput = document.getElementById('charSearchInput');
  if (charSearchInput) {
    charSearchInput.addEventListener('input', function() {
      searchChars(this.value.trim());
    });
  }
}

/**
 * 更新单字框图层
 */
function updateCharBoxesLayer() {
  const layer = document.getElementById('charBoxesLayer');
  if (!viewerState.showCharBoxes) {
    layer.innerHTML = '';
    return;
  }

  layer.innerHTML = '';

  viewerState.charBoxes.forEach((box, index) => {
    const div = document.createElement('div');
    div.className = 'char-box';
    div.style.left = `${viewerState.offsetX + box.x * viewerState.scale}px`;
    div.style.top = `${viewerState.offsetY + box.y * viewerState.scale}px`;
    div.style.width = `${box.width * viewerState.scale}px`;
    div.style.height = `${box.height * viewerState.scale}px`;

    const label = document.createElement('div');
    label.className = 'char-box-label';
    label.textContent = box.char;
    div.appendChild(label);

    // 点击显示单字详情
    div.addEventListener('click', () => showCharDetail(box));

    layer.appendChild(div);
  });
}

/**
 * 显示单字详情
 */
function showCharDetail(box) {
  const modal = document.getElementById('charModal');
  document.getElementById('charDetailText').textContent = box.char;
  document.getElementById('charDetailIndex').textContent = box.index + 1;

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

/**
 * 搜索单字
 */
function searchChars(keyword) {
  if (!keyword) {
    document.querySelectorAll('.char-card').forEach(card => {
      card.style.display = '';
    });
    return;
  }

  document.querySelectorAll('.char-card').forEach(card => {
    const char = card.dataset.char;
    if (char.includes(keyword)) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
}

/**
 * 初始化操作按钮
 */
function initActions() {
  // 收藏作品
  document.getElementById('collectBtn')?.addEventListener('click', () => {
    alert('收藏成功！');
  });

  // 添加到字集
  document.getElementById('addToCollectionBtn')?.addEventListener('click', () => {
    alert('功能开发中：将打开字集选择弹窗');
  });

  // 下载图片
  document.getElementById('downloadBtn')?.addEventListener('click', () => {
    if (viewerState.image) {
      const a = document.createElement('a');
      a.href = viewerState.image.src;
      a.download = '兰亭集序.png';
      a.click();
    }
  });

  // 单字卡片点击
  document.querySelectorAll('.char-card').forEach(card => {
    card.addEventListener('click', () => {
      const char = card.dataset.char;
      const index = card.dataset.index;
      const box = viewerState.charBoxes.find(b => b.char === char);
      if (box) {
        showCharDetail(box);
      }
    });
  });

  // 关闭单字详情弹窗
  document.getElementById('charModalClose')?.addEventListener('click', closeCharModal);
  document.getElementById('charModalOverlay')?.addEventListener('click', closeCharModal);

  // ESC关闭弹窗
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCharModal();
    }
  });
}

/**
 * 关闭单字详情弹窗
 */
function closeCharModal() {
  const modal = document.getElementById('charModal');
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

/**
 * 初始化评论功能
 */
function initComments() {
  // 评论点赞
  document.querySelectorAll('.comment-action').forEach(btn => {
    btn.addEventListener('click', function() {
      if (this.querySelector('.action-icon')) {
        const countSpan = this.querySelector('.action-count');
        if (countSpan) {
          let count = parseInt(countSpan.textContent);
          if (this.classList.contains('liked')) {
            this.classList.remove('liked');
            count--;
          } else {
            this.classList.add('liked');
            count++;
          }
          countSpan.textContent = count;
        }
      }
    });
  });

  // 发表评论
  const commentBtn = document.querySelector('.comment-composer .btn');
  const commentTextarea = document.querySelector('.comment-textarea');

  if (commentBtn && commentTextarea) {
    commentBtn.addEventListener('click', () => {
      const content = commentTextarea.value.trim();
      if (!content) {
        alert('请输入评论内容');
        return;
      }

      // 实际应用中应该发送到服务器
      alert('评论发表成功！');
      commentTextarea.value = '';
    });
  }
}

/**
 * 加载模拟数据
 */
function loadMockData() {
  // 在实际应用中，这里应该从URL参数获取作品ID，然后从服务器加载数据
  console.log('作品详情页已加载');
}
