# 第八課插圖：先用簡單的圖示卡（SVG 內放一個表情符號），之後可換成自製插畫。
def card(emoji, bg="#eef6fb"):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120">'
            f'<rect width="100%" height="100%" rx="12" fill="{bg}"/>'
            f'<text x="80" y="82" font-size="68" text-anchor="middle">{emoji}</text></svg>')
def color(fill):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120">'
            f'<rect width="100%" height="100%" rx="12" fill="#f6f6f6"/><rect x="45" y="25" width="70" height="70" rx="10" fill="{fill}"/></svg>')
ART = {
    "map": card("🗺️"), "bus": card("🚌"), "castle": card("🏯"), "zoo": card("🦁", "#fff4e0"), "pool": card("🏊", "#e6f4ff"),
    "museum": card("🏛️"), "slide": card("🛝", "#fff4e0"), "cannon": card("💣"), "ground": card("🟫", "#f6f6f6"), "sky": card("☁️", "#e6f4ff"),
    "tower": card("🗼"), "bluebox": color("#4a8fe7"), "greenbox": color("#4cae6a"), "wall": card("🧱"), "flower": card("🌸", "#fff0f5"),
    "moss": card("🌿", "#eefbea"), "happy": card("😄", "#fff8e0"), "bored": card("😑", "#f3f3f3"), "scared": card("😨", "#f3f3f3"),
    "guard": card("💂"), "gem": card("💎"),
}
