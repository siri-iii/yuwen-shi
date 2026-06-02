# 玉纹识 · 前端说明

## 目录

- `index.html`：页面入口（首页 / 识别 / 结果 / 知识库 / 项目说明）
- `styles.css`：玉文化主题样式
- `app.js`：前端交互与接口调用
- `assets/images/`：装饰图片（见该目录下 README）

## 运行方式

1. 先启动后端（默认 `http://127.0.0.1:5000`）：

```bash
cd backend
python app.py
```

2. 启动前端静态服务（在 `frontend/` 目录）：

```bash
python -m http.server 5500
```

3. 浏览器访问：

```text
http://127.0.0.1:5500
```

## 已对接接口

- `GET /api/health`
- `GET /api/patterns`
- `GET /api/patterns/<pattern_id>`
- `GET /api/artifacts?pattern=<id>`
- `POST /api/recognize`
- 图片静态资源：`/static/images/<pattern>/<filename>`

## 装饰图片放置

详见 `assets/images/README.md`。常用：

| 文件 | 路径 |
|------|------|
| 首页背景 | `assets/images/hero-bg.jpg` |
| 首页装饰 | `assets/images/hero-accent.png` |
| 导航 Logo | `assets/images/logo.png` |
| 纹样封面 | `assets/images/patterns/dragon.jpg` 等 8 张 |

未放置图片时自动使用渐变背景与后端示例图，不影响功能。

## 说明

- 示例图片上传使用后端约定的文件名：`<pattern_id>_demo_01.jpg` / `..._02.jpg`，可命中文件名映射识别逻辑。
- 后端地址默认读取 `localStorage.YW_API_BASE`，若不存在则使用 `http://127.0.0.1:5000`。
