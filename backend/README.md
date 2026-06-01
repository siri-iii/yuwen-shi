# 玉纹识 · 后端说明

## 环境要求

- Python 3.9+

## 安装依赖

```bash
pip install -r requirements.txt
```

## 启动后端

```bash
cd backend
python app.py
```

后端默认运行在 `http://127.0.0.1:5000`。

## 接口列表

| 接口 | 方法 | 说明 |
|---|---|---|
| `/api/health` | GET | 健康检查 |
| `/api/patterns` | GET | 获取全部 8 类纹样知识 |
| `/api/patterns/<pattern_id>` | GET | 获取单类纹样详情 |
| `/api/artifacts?pattern=<id>` | GET | 获取某类纹样的玉器案例 |
| `/api/recognize` | POST | 上传图片并返回识别结果 |

### /api/recognize 请求格式

- 方法：POST，Content-Type：multipart/form-data
- 字段名：`image`，值：图片文件（支持 jpg / png）

### /api/recognize 返回示例

```json
{
  "success": true,
  "pattern_id": "dragon",
  "pattern_name": "龙纹",
  "confidence": 0.92,
  "is_demo": true,
  "note": "",
  "visual_reason": "...",
  "knowledge": {
    "meaning": "...",
    "common_objects": ["玉佩", "玉璧"],
    "periods": ["春秋战国", "汉代"],
    "appreciation": "..."
  },
  "similar_artifacts": [
    {
      "artifact_id": "A001",
      "name": "战国龙纹玉佩",
      "pattern": "dragon",
      "period": "战国",
      "object_type": "玉佩",
      "image": "/static/images/dragon/dragon_01.png",
      "description": "...",
      "source": "公开博物馆资料"
    }
  ],
  "ai_explanation": "系统识别该图片可能包含龙纹元素。..."
}
```

## 目录说明

```
backend/
├── app.py          # Flask 主入口
├── recognition.py  # 识别逻辑（示例映射 + pHash）
├── knowledge.py    # 读取 patterns.json / artifacts.json
├── generator.py    # AI 文化讲解文本生成
├── config.py       # 路径配置
├── requirements.txt
└── uploads/        # 上传图片临时目录（自动创建）

data/
├── patterns.json   # 8 类纹样知识库
├── artifacts.json  # 24 条玉器案例
├── demo_images.json# 示例图片与纹样映射
└── images/         # 8 类纹样图片
```

## 识别逻辑说明

后端采用**展示型识别策略**，保证演示视频结果稳定：

1. **文件名映射（优先）**：上传文件名与 `demo_images.json` 中的键匹配时，直接返回预设的纹样和置信度，结果 100% 稳定。
2. **pHash 相似度匹配（回退）**：文件名未命中时，用感知哈希算法将上传图片与样本库比对，返回最相似类别，并附加"仅供学习参考"提示。

演示时请使用 `demo_images.json` 中列出的文件名上传图片。

## 系统局限性

- 数据规模：仅覆盖 8 类常见玉器纹样，不能识别全部历史纹样。
- 识别精度：非示例图片的 pHash 匹配对光线、角度、图片质量敏感，结果仅供参考。
- 非专业鉴定：本系统为学习辅助工具，不具备玉器真伪鉴定、材质检测或年代精确断代能力。
