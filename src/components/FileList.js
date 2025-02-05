import React from "react";

const FileList = ({ files, onSelectFile }) => {
    return (
        <div className="file-list">
            <h3>Available Files</h3>
            <ul>
                {files.length === 0 ? (
                    <p>No files found.</p>
                ) : (
                    files.map((file, index) => (
                        <li key={index} onClick={() => onSelectFile(file)}>
                            {file}
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
};

export default FileList;
