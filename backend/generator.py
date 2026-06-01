def generate_explanation(pattern_data):
    """根据纹样知识库数据填充 AI 文化讲解模板。"""
    name = pattern_data.get("name", "")
    visual = pattern_data.get("visual_features", "")
    meaning = pattern_data.get("cultural_meaning", "")
    objects = "、".join(pattern_data.get("common_objects", []))
    periods = "、".join(pattern_data.get("periods", []))
    tips = pattern_data.get("appreciation_tips", "")

    return (
        f"系统识别该图片可能包含{name}元素。\n\n"
        f"从视觉特征看，该纹样通常表现为{visual}\n\n"
        f"在中国玉文化中，{name}常被理解为{meaning}\n\n"
        f"这类纹样常见于{objects}，与{periods}的审美和礼制观念有关。\n\n"
        f"鉴赏时可以重点观察{tips}"
    )
