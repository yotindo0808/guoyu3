# 第八課插圖：先用簡單的圖示卡（SVG 內放一個表情符號），之後可換成自製插畫。
def card(emoji, bg="#eef6fb"):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120">'
            f'<rect width="100%" height="100%" rx="12" fill="{bg}"/>'
            f'<text x="80" y="82" font-size="68" text-anchor="middle">{emoji}</text></svg>')
def color(fill):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120">'
            f'<rect width="100%" height="100%" rx="12" fill="#f6f6f6"/><rect x="45" y="25" width="70" height="70" rx="10" fill="{fill}"/></svg>')
def scene(items, bg="#eef6fb", ground=None):
    """情境圖：items 為 (表情符號, x, y, 大小)，ground 為地面顏色。畫布 320×200。"""
    g = f'<rect y="150" width="320" height="50" fill="{ground}"/>' if ground else ""
    t = "".join(f'<text x="{x}" y="{y}" font-size="{z}" text-anchor="middle">{e}</text>' for e, x, y, z in items)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200"><rect width="100%" height="100%" rx="14" fill="{bg}"/>{g}{t}</svg>'
def strip(*panels):
    """連環圖：兩到三格，每格 items 同 scene，以箭頭連接。畫布 320×200。"""
    n = len(panels); w = 320 // n; out = ""
    for k, items in enumerate(panels):
        x0 = k * w; out += f'<rect x="{x0 + 4}" y="4" width="{w - 8}" height="192" rx="10" fill="#fff" stroke="#bcd"/>'
        out += "".join(f'<text x="{x0 + x}" y="{y}" font-size="{z}" text-anchor="middle">{e}</text>' for e, x, y, z in items)
        if k < n - 1: out += f'<text x="{x0 + w}" y="108" font-size="22" text-anchor="middle" fill="#789">▶</text>'
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200"><rect width="100%" height="100%" rx="14" fill="#eef3f6"/>{out}</svg>'
ART = {
    "w_jiaoyu": scene([("👩‍🏫", 90, 130, 80), ("📖", 170, 150, 44), ("🧒", 240, 140, 64), ("💡", 250, 70, 40)]),
    "w_museum": scene([("🏛️", 100, 130, 96), ("🏺", 210, 145, 50), ("🧑‍🤝‍🧑", 270, 150, 50)], ground="#e4dccb"),
    "w_shiliao": scene([("📜", 90, 125, 76), ("🖼️", 175, 120, 60), ("🔍", 250, 140, 54)]),
    "w_model": strip([("🏯", 53, 130, 80)], [("🏯", 53, 128, 34), ("🤲", 53, 160, 44)]),
    "w_holland": scene([("🌷", 80, 150, 50), ("🌷", 120, 155, 42), ("🏡", 220, 130, 70), ("🌍", 270, 60, 36)], bg="#e8f4ff", ground="#bfe3a7"),
    "w_zheng": scene([("⛵", 100, 120, 70), ("🧔", 210, 130, 76), ("🏝️", 270, 160, 40)], bg="#e6f2fb", ground="#9fd3f0"),
    "w_win": strip([("🧒", 30, 120, 44), ("🧒", 75, 120, 44), ("🏃", 53, 170, 30)], [("🧒", 53, 110, 50), ("🏆", 53, 165, 40)]),
    "w_zhushou": scene([("🏯", 110, 130, 90), ("💂", 220, 145, 60), ("💂", 270, 145, 60)], ground="#d9cfb6"),
    "w_shouhu": scene([("🛡️", 120, 130, 70), ("🐣", 200, 150, 50), ("🐔", 250, 140, 60)], ground="#cfe8b6"),
    "w_brave": scene([("🧒", 110, 140, 70), ("💪", 170, 110, 44), ("🌉", 250, 150, 56)], bg="#fff6e6"),
    "w_soldier": scene([("💂", 100, 145, 76), ("💂", 170, 145, 76), ("💂", 240, 145, 76)], ground="#cfe0c4"),
    "w_near": scene([("🏠", 90, 140, 70), ("👣", 160, 165, 30), ("🏪", 230, 140, 70)], ground="#dde6d0"),
    "w_tower": scene([("🗼", 110, 150, 120), ("🧒", 108, 52, 26), ("👀", 210, 80, 40), ("⛵", 270, 140, 36)], bg="#e6f2fb"),
    "w_roof": scene([("🏠", 160, 160, 130), ("⬇️", 160, 40, 30)], bg="#e8f4ff"),
    "w_landmark": scene([("🏙️", 80, 150, 60), ("🗼", 170, 160, 110), ("📍", 230, 70, 46)], bg="#e8f4ff"),
    "w_jianshou": strip([("💂", 53, 130, 60), ("☀️", 85, 50, 30)], [("💂", 53, 130, 60), ("🌧️", 85, 50, 30)], [("💂", 53, 130, 60), ("🌙", 85, 50, 30)]),
    "w_gem": scene([("💎", 120, 130, 80), ("🤲", 210, 160, 56), ("✨", 200, 70, 36)], bg="#f3eefc"),

    "map": card("🗺️"), "bus": card("🚌"), "castle": card("🏯"), "zoo": card("🦁", "#fff4e0"), "pool": card("🏊", "#e6f4ff"),
    "museum": card("🏛️"), "slide": card("🛝", "#fff4e0"), "cannon": card("💣"), "ground": card("🟫", "#f6f6f6"), "sky": card("☁️", "#e6f4ff"),
    "tower": card("🗼"), "bluebox": color("#4a8fe7"), "greenbox": color("#4cae6a"), "wall": card("🧱"), "flower": card("🌸", "#fff0f5"),
    "moss": card("🌿", "#eefbea"), "happy": card("😄", "#fff8e0"), "bored": card("😑", "#f3f3f3"), "scared": card("😨", "#f3f3f3"),
    "guard": card("💂"), "gem": card("💎"),
}
