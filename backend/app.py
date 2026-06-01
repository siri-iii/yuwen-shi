import os
import uuid
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

from config import UPLOADS_DIR, IMAGES_DIR
from knowledge import get_all_patterns, get_pattern, get_artifacts_by_pattern
from recognition import recognize
from generator import generate_explanation

app = Flask(__name__)
CORS(app)

# 静态图片路由：/static/images/<pattern>/<file>
@app.route("/static/images/<pattern_dir>/<filename>")
def serve_image(pattern_dir, filename):
    directory = os.path.join(IMAGES_DIR, pattern_dir)
    return send_from_directory(directory, filename)


# ── 健康检查 ──────────────────────────────────────────────────────────────────

@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


# ── 纹样知识库 ─────────────────────────────────────────────────────────────────

@app.route("/api/patterns")
def patterns_list():
    return jsonify(get_all_patterns())


@app.route("/api/patterns/<pattern_id>")
def pattern_detail(pattern_id):
    data = get_pattern(pattern_id)
    if not data:
        return jsonify({"error": "纹样不存在"}), 404
    return jsonify(data)


# ── 玉器案例库 ─────────────────────────────────────────────────────────────────

@app.route("/api/artifacts")
def artifacts():
    pattern_id = request.args.get("pattern")
    return jsonify(get_artifacts_by_pattern(pattern_id))


# ── 图片识别 ───────────────────────────────────────────────────────────────────

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"}

def _allowed(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/api/recognize", methods=["POST"])
def recognize_image():
    if "image" not in request.files:
        return jsonify({"success": False, "error": "请上传图片文件（字段名：image）"}), 400

    file = request.files["image"]
    if not file.filename or not _allowed(file.filename):
        return jsonify({"success": False, "error": "仅支持 jpg / png 格式"}), 400

    # 保留原始文件名（用于示例图片映射），保存到 uploads/
    ext = file.filename.rsplit(".", 1)[1].lower()
    original_stem = os.path.splitext(file.filename)[0]
    save_name = f"{original_stem}_{uuid.uuid4().hex[:6]}.{ext}"
    upload_path = os.path.join(UPLOADS_DIR, save_name)

    # 同时保存一份以原始文件名命名的副本，供文件名映射使用
    original_path = os.path.join(UPLOADS_DIR, file.filename)
    file.save(original_path)
    import shutil
    shutil.copy(original_path, upload_path)

    pattern_id, confidence, is_demo = recognize(original_path)

    if not pattern_id:
        return jsonify({"success": False, "error": "无法识别该图片，请尝试其他图片"}), 422

    pattern_data = get_pattern(pattern_id)
    similar = get_artifacts_by_pattern(pattern_id)[:3]
    explanation = generate_explanation(pattern_data)

    visual_reason = (
        f"该图片中的纹样具有{pattern_data.get('visual_features', '')}，"
        f"与{pattern_data.get('name', '')}样本库中的图像特征相近。"
    )

    result = {
        "success": True,
        "pattern_id": pattern_id,
        "pattern_name": pattern_data.get("name"),
        "confidence": confidence,
        "is_demo": is_demo,
        "note": "" if is_demo else "非示例图片，结果仅供学习参考",
        "visual_reason": visual_reason,
        "knowledge": {
            "meaning": pattern_data.get("cultural_meaning"),
            "common_objects": pattern_data.get("common_objects"),
            "periods": pattern_data.get("periods"),
            "appreciation": pattern_data.get("appreciation_tips"),
        },
        "similar_artifacts": similar,
        "ai_explanation": explanation,
    }
    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
