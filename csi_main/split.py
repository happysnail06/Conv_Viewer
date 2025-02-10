import json
import os

# File name
type = 'Passive'
# type = 'Active'
# type = 'Less_Active'

# model = 'chatcrs'
model = 'CSI'
input_filename = f"public/csi_main/raw/{model}_clothing_{type}_150_2025-02-09.json"

# Extract the directory name correctly (remove full path and 'CSI_')
filename_only = os.path.basename(input_filename)  # Get 'CSI_clothing_Active_150_2025-02-09.json'
dir_name = filename_only.replace(".json", "")

# Define the correct output directory
output_dir = os.path.join("public/csi_main/split", dir_name)

# Create the directory if it doesn't exist
os.makedirs(output_dir, exist_ok=True)

# Read the input JSON file
with open(input_filename, "r", encoding="utf-8") as file:
    data = json.load(file)

# Store each entry as a separate JSON file
for idx, entry in enumerate(data):
    output_filename = os.path.join(output_dir, f"{model}_{type}_{idx}.json")
    with open(output_filename, "w", encoding="utf-8") as out_file:
        json.dump(entry, out_file, indent=4, ensure_ascii=False)

print(f"Processed {len(data)} entries and saved them in '{output_dir}' directory.")
