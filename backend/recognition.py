import json
import os
import glob
import imagehash
from PIL import Image
from config import DEMO_IMAGES_FILE, IMAGES_DIR


def _load_demo_map():
    with open(DEMO_IMAGES_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def _stem(filename):
    """返回不含扩展名的文件名（小写）。"""
    return os.path.splitext(os.path.basename(filename))[0].lower()


def _match_by_filename(upload_path):
    """
    用上传文件的 stem 匹配 demo_images.json 中的键（忽略扩展名差异）。
    demo_images.json 的键可能是 .jpg，实际图片可能是 .png，统一用 stem 比对。
    """
    demo_map = _load_demo_map()
    upload_stem = _stem(upload_path)
    for key, value in demo_map.items():
        if _stem(key) == upload_stem:
            return value["pattern_id"], value["confidence"]
    return None, None


def _build_sample_hashes():
    """为 data/images/ 下所有纹样图片预先计算 pHash，返回 [(hash, pattern_id), ...]。"""
    entries = []
    for pattern_dir in glob.glob(os.path.join(IMAGES_DIR, "*")):
        pattern_id = os.path.basename(pattern_dir)
        for img_path in glob.glob(os.path.join(pattern_dir, "*.png")) + \
                        glob.glob(os.path.join(pattern_dir, "*.jpg")):
            try:
                h = imagehash.phash(Image.open(img_path))
                entries.append((h, pattern_id))
            except Exception:
                pass
    return entries


def _match_by_phash(upload_path):
    """
    用 pHash 将上传图片与样本库比对，返回最相似的 (pattern_id, confidence)。
    汉明距离越小越相似；距离 > 20 认为无把握，返回相似度最高但置信度偏低的结果。
    """
    try:
        upload_hash = imagehash.phash(Image.open(upload_path))
    except Exception:
        return None, None

    sample_hashes = _build_sample_hashes()
    if not sample_hashes:
        return None, None

    best_distance = None
    best_pattern = None
    for h, pattern_id in sample_hashes:
        dist = upload_hash - h
        if best_distance is None or dist < best_distance:
            best_distance = dist
            best_pattern = pattern_id

    # 汉明距离映射为置信度：距离 0 → 0.95，距离 20 → 0.60，距离 ≥ 30 → 0.40
    if best_distance is None:
        return None, None
    if best_distance == 0:
        confidence = 0.95
    elif best_distance <= 20:
        confidence = round(0.95 - best_distance * 0.0175, 2)
    else:
        confidence = 0.40

    return best_pattern, confidence


def recognize(upload_path):
    """
    主识别入口。
    1. 优先匹配文件名（示例图片映射，结果稳定）。
    2. 未命中时用 pHash 相似度匹配，并附加"仅供学习参考"提示。
    返回 (pattern_id, confidence, is_demo)
    """
    pattern_id, confidence = _match_by_filename(upload_path)
    if pattern_id:
        return pattern_id, confidence, True

    pattern_id, confidence = _match_by_phash(upload_path)
    if pattern_id:
        return pattern_id, confidence, False

    return None, None, False
