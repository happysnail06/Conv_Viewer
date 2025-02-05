// src/components/DialogueViewer.js
import React, { useState, useEffect, useCallback } from 'react';
import { FaUserAlt, FaRobot } from 'react-icons/fa';

//
// USER MESSAGE COMPONENT (Seeker)
// Displays only the content and the user icon.
//
const UserMessage = ({ message }) => (
  <div className="message user">
    <div className="bubble">
      <p className="utterance">{message.content}</p>
    </div>
    <div className="avatar">
      <FaUserAlt />
    </div>
  </div>
);

//
// AGENT MESSAGE COMPONENT (Recommender)
// Displays a toggle button to show/hide the reasoning (Thought & Action)
// above the main content. If the message starts with the header 
// "Here are some items that you might like:", the remainder is parsed into a bullet list
// that extracts keys: Product Name, Item ID, Categories, and Description (keeping their values as is).
// Otherwise, the content is rendered as provided.
//
const AgentMessage = ({ message, globalShowReasoning }) => {
  const [localShowDetails, setLocalShowDetails] = useState(false);
  const toggleLocalDetails = useCallback(() => setLocalShowDetails(prev => !prev), []);
  const finalShowDetails = globalShowReasoning || localShowDetails;

  const header = "Here are some items that you might like:";

  // Helper function: Parse item suggestions without stripping bracketed text.
  const parseItemSuggestions = (text) => {
    // Split based on lookahead for a number followed by a dot (e.g., "1.")
    const itemStrings = text.split(/(?=\d+\.)/);
    // We only care about these keys:
    const allowedKeys = new Set(["Product Name", "Item ID", "Categories", "Description"]);
    const items = itemStrings.map(itemStr => {
      itemStr = itemStr.trim();
      let bullet = "";
      const bulletMatch = itemStr.match(/^(\d+\.)\s*/);
      if (bulletMatch) {
        bullet = bulletMatch[1]; // e.g., "1."
        itemStr = itemStr.slice(bulletMatch[0].length);
      }
      // Split the item text into lines.
      const lines = itemStr.split('\n').map(line => line.trim()).filter(line => line !== "");
      const attributes = {};
      // Use a loop so that if a key's value is empty, we can optionally check the next line.
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const colonIndex = line.indexOf(':');
        if (colonIndex !== -1) {
          const key = line.slice(0, colonIndex).trim();
          let value = line.slice(colonIndex + 1).trim();
          // If value is empty and the next line exists (and doesn't contain a colon), use that line.
          if (value === "" && i + 1 < lines.length && lines[i + 1].indexOf(':') === -1) {
            value = lines[i + 1];
            i++; // Skip the next line as it's been consumed.
          }
          if (allowedKeys.has(key)) {
            attributes[key] = value;
          }
        } else {
          // If no colon is found, append to Description.
          if (attributes["Description"]) {
            attributes["Description"] += " " + line;
          } else {
            attributes["Description"] = line;
          }
        }
      }
      return { bullet, attributes };
    });
    return items;
  };

  // Helper function: Render the utterance.
  const renderUtterance = () => {
    if (message.content.startsWith(header)) {
      // For item suggestions, do not remove bracketed text.
      const itemsPart = message.content.slice(header.length).trim();
      const items = parseItemSuggestions(itemsPart);
      return (
        <>
          <p className="utterance-header">{header}</p>
          <ul className="utterance-list">
            {items.map((item, idx) => (
              <li key={idx}>
                <span className="bullet">{item.bullet} </span>
                <ul className="item-attributes">
                  {Object.entries(item.attributes).map(([key, value]) => (
                    <li key={key}>
                      <strong>{key}:</strong> {value}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </>
      );
    } else {
      // For other content, render as provided (preserving all brackets).
      const lines = message.content.split("\n").filter(line => line.trim() !== "");
      return lines.map((line, index) => (
        <p className="utterance" key={index}>{line}</p>
      ));
    }
  };

  return (
    <div className="message agent">
      <div className="avatar">
        <FaRobot />
      </div>
      <div className="bubble">
        {(message.thought || message.action) && (
          <button className="toggle-button" onClick={toggleLocalDetails}>
            {localShowDetails ? "Hide Reasoning" : "Show Reasoning"}
          </button>
        )}
        {finalShowDetails && (
          <div className="details">
            {message.thought && (
              <p className="thought">
                <strong>Thought:</strong> {message.thought}
              </p>
            )}
            {message.action && (
              <p className="action">
                <strong>Action:</strong> {message.action}
              </p>
            )}
          </div>
        )}
        {renderUtterance()}
      </div>
    </div>
  );
};

//
// DIALOGUE VIEWER COMPONENT
// Expects a JSON object with keys "thoughts", "actions", and "conversation".
// If the incoming data is a string, it is parsed first.
//
const DialogueViewer = ({ fileName, data }) => {
  const [parsedData, setParsedData] = useState(null);
  const [globalShowReasoning, setGlobalShowReasoning] = useState(false);

  // Always parse the incoming data if it's a string.
  useEffect(() => {
    if (!data) {
      setParsedData(null);
      return;
    }
    if (typeof data === 'string') {
      try {
        setParsedData(JSON.parse(data));
      } catch (error) {
        console.error("Error parsing JSON data:", error);
        setParsedData(null);
      }
    } else {
      setParsedData(data);
    }
  }, [data]);

  useEffect(() => {
    console.log("Received data:", parsedData);
  }, [parsedData]);

  if (!parsedData) {
    return <p>No data provided.</p>;
  }

  // Determine the conversation array.
  let conversationArray = null;
  if (Array.isArray(parsedData.conversation)) {
    conversationArray = parsedData.conversation;
  } else if (Array.isArray(parsedData)) {
    conversationArray = parsedData;
  } else {
    console.error("Invalid data structure: 'conversation' is missing or not an array.");
    return <p>No conversation data available.</p>;
  }

  // Filter to include only messages with role 'user' or 'assistant'.
  conversationArray = conversationArray.filter(
    (msg) => msg.role === "user" || msg.role === "assistant"
  );

  // Map assistant messages to include their corresponding thought and action.
  let assistantIndex = 0;
  const finalDialogue = conversationArray.map((message) => {
    if (message.role === "assistant") {
      const updatedMessage = {
        ...message,
        thought: parsedData.thoughts && parsedData.thoughts[assistantIndex] ? parsedData.thoughts[assistantIndex] : "",
        action: parsedData.actions && parsedData.actions[assistantIndex] ? parsedData.actions[assistantIndex] : ""
      };
      assistantIndex++;
      return updatedMessage;
    }
    return message;
  });

  if (finalDialogue.length === 0) {
    return <p>No messages to display.</p>;
  }

  return (
    <div className="dialogue-viewer">
      {fileName && <h3>Viewing: {fileName}</h3>}
      <button
        className="global-toggle-button"
        onClick={() => setGlobalShowReasoning(prev => !prev)}
      >
        {globalShowReasoning ? "Hide All Reasoning" : "Show All Reasoning"}
      </button>
      <div className="chat-container">
        {finalDialogue.map((message, index) => {
          if (message.role === "user") {
            return <UserMessage key={index} message={message} />;
          } else if (message.role === "assistant") {
            return (
              <AgentMessage
                key={index}
                message={message}
                globalShowReasoning={globalShowReasoning}
              />
            );
          } else {
            return null;
          }
        })}
      </div>
    </div>
  );
};

export default DialogueViewer;
