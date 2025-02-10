const fs = require("fs");
const path = require("path");

const BASE_DIR = path.join(__dirname, "../public/csi_main/split");
const OUTPUT_FILE = path.join(BASE_DIR, "file_list.json");

if (!fs.existsSync(BASE_DIR)) {
    console.error("❌ Error: Base directory does not exist!");
    process.exit(1);
}

// Read all subdirectories in BASE_DIR
const directories = fs.readdirSync(BASE_DIR).filter(dir => 
    fs.statSync(path.join(BASE_DIR, dir)).isDirectory()
);

let allFiles = [];

directories.forEach(dir => {
    const dirPath = path.join(BASE_DIR, dir);
    const jsonFiles = fs.readdirSync(dirPath)
        .filter(file => file.endsWith(".json"))
        .map(file => path.join(dir, file)); // Store relative paths

    allFiles.push(...jsonFiles);
});

// Sort for consistency
allFiles.sort((a, b) => {
    const numA = parseInt(a.match(/\d+(?=\.json$)/)?.[0] || "0", 10);
    const numB = parseInt(b.match(/\d+(?=\.json$)/)?.[0] || "0", 10);
    return numA - numB;
});


try {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allFiles, null, 2));
    console.log(`✅ file_list.json created at ${OUTPUT_FILE} with ${allFiles.length} files.`);
} catch (writeErr) {
    console.error("❌ Error writing file_list.json:", writeErr);
    process.exit(1);
}
