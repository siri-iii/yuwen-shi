# 前端装饰图片放置说明

把图片放在本目录（`frontend/assets/images/`）后，刷新浏览器即可生效（无需改代码）。

## 必推荐（首页氛围）

| 文件名 | 用途 | 建议尺寸 |
|--------|------|----------|
| `hero-bg.jpg` | 首页大横幅背景 | 1920×1080 或更宽，玉器/纹样主题 |
| `hero-accent.png` | 首页右侧装饰（可选，透明 PNG） | 约 600×600 |

未放置时页面会使用 CSS 渐变背景，不影响功能。

## 可选（增强质感）

| 文件名 | 用途 |
|--------|------|
| `texture.png` | 全站淡淡纹理叠加（低对比度） |
| `logo.png` | 导航栏 Logo，建议正方形 64×64 以上 |

## 纹样卡片封面（可选，8 张）

放在 `patterns/` 子目录，文件名与纹样 ID 一致：

```
patterns/dragon.jpg
patterns/phoenix.jpg
patterns/beast_face.jpg
patterns/cloud_thunder.jpg
patterns/grain.jpg
patterns/rush.jpg
patterns/chi.jpg
patterns/string.jpg
```

未放置时，知识库卡片会自动使用后端 `/static/images/...` 的示例图。

## 版权提示

请使用自有拍摄、课程素材或已授权可商用的图片；演示用途也建议保留来源记录。
