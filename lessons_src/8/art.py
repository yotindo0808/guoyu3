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

# ── 自繪圖示（參考老師提供的圖重畫成簡單圖示）──
def g_tower(x=0, y=0, k=1.0):
    """瞭望臺：紅紅的屋頂、白色的牆，又高又大（畫布約 100×150）"""
    return (f'<g transform="translate({x},{y}) scale({k})" stroke="#3a3a3a" stroke-width="2.5" stroke-linejoin="round">'
            '<path d="M30 145 L38 55 L62 55 L70 145 Z" fill="#fbfaf5"/>'
            '<path d="M34 110 L66 110 M36 85 L64 85" fill="none" stroke-width="1.5" stroke="#b9b3a6"/>'
            '<rect x="45" y="118" width="10" height="27" rx="5" fill="#8a5a3c"/>'
            '<rect x="45" y="92" width="10" height="12" rx="2" fill="#7fb7d9"/>'
            '<rect x="45" y="66" width="10" height="12" rx="2" fill="#7fb7d9"/>'
            '<rect x="30" y="49" width="40" height="7" rx="2" fill="#d9d4c7"/>'
            '<rect x="38" y="30" width="24" height="19" fill="#fbfaf5"/><rect x="43" y="34" width="14" height="11" rx="2" fill="#ffe9a8"/>'
            '<path d="M32 31 L50 8 L68 31 Z" fill="#d9483b"/><circle cx="50" cy="7" r="3" fill="#d9483b"/></g>')
def g_cannon(x=0, y=0, k=1.0):
    """古炮：黑色炮管、木頭炮架、輪子（畫布約 170×100）"""
    spokes = "".join(f'<line x1="70" y1="70" x2="{70 + 22 * c}" y2="{70 + 22 * s}"/>' for c, s in [(1, 0), (.7, .7), (0, 1), (-.7, .7), (-1, 0), (-.7, -.7), (0, -1), (.7, -.7)])
    return (f'<g transform="translate({x},{y}) scale({k})" stroke="#2f2f2f" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">'
            '<path d="M18 92 L40 70 L95 66 L100 74 L46 80 L26 96 Z" fill="#9a6a3f"/>'
            '<g transform="rotate(-18 80 55)"><rect x="28" y="40" width="120" height="30" rx="14" fill="#4a4f55"/>'
            '<rect x="138" y="36" width="14" height="38" rx="4" fill="#3c4046"/><rect x="60" y="38" width="7" height="34" rx="2" fill="#5d636a"/>'
            '<rect x="100" y="38" width="7" height="34" rx="2" fill="#5d636a"/><circle cx="24" cy="55" r="7" fill="#3c4046"/></g>'
            f'<circle cx="70" cy="70" r="26" fill="#e9c98f"/><g stroke-width="2">{spokes}</g><circle cx="70" cy="70" r="26" fill="none" stroke-width="5" stroke="#8a5a3c"/>'
            '<circle cx="70" cy="70" r="6" fill="#c9a061"/></g>')
def g_wall(x=0, y=0, k=1.0):
    """老城牆：石磚牆，長滿樹根和青苔（畫布約 200×110）"""
    bricks = ""
    for r in range(4):
        off = 0 if r % 2 == 0 else 20
        for c in range(-1, 6):
            bx = 10 + off + c * 40
            if bx < 10 or bx > 170: continue
            bricks += f'<rect x="{bx}" y="{25 + r * 20}" width="38" height="18" rx="3" fill="#d8b99a"/>'
    return (f'<g transform="translate({x},{y}) scale({k})" stroke="#6f5640" stroke-width="2" stroke-linejoin="round">'
            '<rect x="8" y="23" width="204" height="84" fill="#c9a888"/>' + bricks +
            '<rect x="20" y="8" width="16" height="16" fill="#d8b99a"/><rect x="60" y="8" width="16" height="16" fill="#d8b99a"/><rect x="100" y="8" width="16" height="16" fill="#d8b99a"/><rect x="140" y="8" width="16" height="16" fill="#d8b99a"/><rect x="180" y="8" width="16" height="16" fill="#d8b99a"/>'
            '<path d="M8 23 H212" fill="none"/>'
            '<g fill="none" stroke="#7a4e2a" stroke-width="4" stroke-linecap="round">'
            '<path d="M55 24 C60 45 45 60 52 80 C56 92 48 100 50 106"/><path d="M53 50 C40 58 34 70 30 82"/><path d="M50 72 C62 80 66 92 72 104"/>'
            '<path d="M150 24 C142 40 158 56 150 74 C146 86 152 96 148 106"/><path d="M151 46 C165 54 170 66 176 80"/></g>'
            '<g fill="#6fae4e" stroke="#4f8a36" stroke-width="1.5"><ellipse cx="50" cy="26" rx="18" ry="7"/><ellipse cx="152" cy="26" rx="16" ry="6"/>'
            '<ellipse cx="110" cy="104" rx="20" ry="5"/><ellipse cx="190" cy="60" rx="8" ry="12"/><ellipse cx="20" cy="90" rx="9" ry="10"/></g></g>')
def icon(inner, vb="0 0 220 165", bg="#eef6fb"):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}"><rect width="100%" height="100%" rx="14" fill="{bg}"/>{inner}</svg>'
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
    "w_tower": icon(g_tower(70, 40, 1.05) + '<text x="122" y="94" font-size="20" text-anchor="middle">🧒</text><text x="220" y="80" font-size="36" text-anchor="middle">👀</text><text x="270" y="150" font-size="34" text-anchor="middle">⛵</text>', vb="0 0 320 200"),
    "w_roof": scene([("🏠", 160, 160, 130), ("⬇️", 160, 40, 30)], bg="#e8f4ff"),
    "w_landmark": icon('<text x="70" y="160" font-size="60" text-anchor="middle">🏙️</text>' + g_tower(130, 40, 1.05) + '<text x="250" y="80" font-size="46" text-anchor="middle">📍</text>', vb="0 0 320 200"),
    "w_jianshou": strip([("💂", 53, 130, 60), ("☀️", 85, 50, 30)], [("💂", 53, 130, 60), ("🌧️", 85, 50, 30)], [("💂", 53, 130, 60), ("🌙", 85, 50, 30)]),
    "bd_bag": scene([("🎒", 60, 140, 80), ("✏️", 140, 110, 40), ("📘", 200, 120, 46), ("🧴", 265, 125, 46)], bg="#fff6e6"),
    "bd_park": scene([("🌳", 70, 140, 80), ("🌷", 150, 150, 46), ("🐦", 230, 80, 44), ("🛝", 270, 150, 40)], bg="#e8f6e1", ground="#bfe3a7"),
    "bd_market": scene([("🍎", 50, 145, 50), ("🍌", 120, 145, 54), ("🍐", 190, 145, 50), ("🍊", 250, 145, 46), ("🍋", 300, 145, 40)], bg="#fff7e0", ground="#e8d7a6"),
    "bd_zoo": scene([("🐘", 55, 140, 62), ("🐨", 125, 140, 52), ("🐑", 190, 145, 48), ("🦆", 245, 150, 40), ("🐰", 295, 150, 40)], bg="#fdecea", ground="#bfe3a7"),
    "w_gem": scene([("💎", 120, 130, 80), ("🤲", 210, 160, 56), ("✨", 200, 70, 36)], bg="#f3eefc"),

    "map": card("🗺️"), "bus": card("🚌"), "castle": card("🏯"), "zoo": card("🦁", "#fff4e0"), "pool": card("🏊", "#e6f4ff"),
    "museum": card("🏛️"), "slide": card("🛝", "#fff4e0"), "cannon": icon(g_cannon(25, 30, 1.0), bg="#f3efe6"), "ground": card("🟫", "#f6f6f6"), "sky": card("☁️", "#e6f4ff"),
    "tower": icon(g_tower(60, 8, 1.0), bg="#e6f2fb"), "bluebox": color("#4a8fe7"), "greenbox": color("#4cae6a"), "wall": icon(g_wall(0, 25, 1.0), bg="#eaf3e3"), "flower": card("🌸", "#fff0f5"),
    "moss": card("🌿", "#eefbea"), "happy": card("😄", "#fff8e0"), "bored": card("😑", "#f3f3f3"), "scared": card("😨", "#f3f3f3"),
    "guard": card("💂"), "gem": card("💎"),
}
