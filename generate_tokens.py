import json

with open("piper_models/en_US-amy-low.onnx.json", "r", encoding="utf-8") as f:
    config = json.load(f)

with open("piper_models/tokens.txt", "w", encoding="utf-8") as f:
    for phoneme, id_list in config["phoneme_id_map"].items():
        for pid in id_list:
            f.write(f"{phoneme} {pid}\n")
