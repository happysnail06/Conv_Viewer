const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../public/example");
const OUTPUT_FILE = path.join(DATA_DIR, "file_list.json");

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
    console.error("❌ Error: dialogue_data directory does not exist!");
    process.exit(1);
}

// Read files and filter only .txt files
fs.readdir(DATA_DIR, (err, files) => {
    if (err) {
        console.error("❌ Error reading dialogue_data directory:", err);
        process.exit(1);
    }

    const textFiles = files.filter(file => file.endsWith(".json"));
    
    // Write the list to file_list.json
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(textFiles, null, 2));
    console.log("✅ file_list.json updated:", textFiles);
});
