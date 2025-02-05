import React, { useState, useEffect } from "react";
import FileList from "./components/FileList";
import DialogueViewer from "./components/DialogueViewer";
import "./App.css";

const App = () => {
    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [dialogueData, setDialogueData] = useState("");

    // Fetch file list from static JSON
    useEffect(() => {
        fetch(process.env.PUBLIC_URL + "/example/file_list.json")
            .then((response) => response.json())
            .then((data) => setFiles(data))
            .catch((error) => console.error("❌ Error fetching file list:", error));
    }, []);

    // Load selected file content
    const loadFileContent = (fileName) => {
        fetch(process.env.PUBLIC_URL + `/example/${fileName}`)
            .then((response) => response.text())
            .then((text) => {
                setSelectedFile(fileName);
                setDialogueData(text);
            })
            .catch((error) => console.error("❌ Error loading file:", error));
    };

    return (
        <div className="app-container">
            <FileList files={files} onSelectFile={loadFileContent} />
            {selectedFile && <DialogueViewer fileName={selectedFile} data={dialogueData} />}
        </div>
    );
};

export default App;
