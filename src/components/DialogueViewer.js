// src/components/DialogueViewer.js
import React, { useState, useEffect, useCallback } from 'react';
import { FaUserAlt, FaRobot } from 'react-icons/fa';

//
// USER DATA CARD COMPONENT
// Renders a card with the user_data information above the conversation.
//
const UserDataCard = ({ userData }) => {
  if (!userData) return null;

  const {
    target_needs,
    budget,
    purchase_reason,
    target_category,
    decision_making_style,
    general_preference,
    dialogue_openness
  } = userData;

  return (
    <div className="user-data-card" style={{ border: "1px solid #ccc", padding: "1rem", marginBottom: "1rem", borderRadius: "8px" }}>
      <h2>User Information</h2>
      {target_needs && <p><strong>Target Needs:</strong> {target_needs}</p>}
      {budget && (
        <p>
          <strong>Budget:</strong> {Array.isArray(budget) ? budget.join(" - ") : budget}
        </p>
      )}
      {purchase_reason && (
        <>
          <p><strong>Purchase Reason:</strong></p>
          {Array.isArray(purchase_reason) ? (
            <ul>
              {purchase_reason.map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          ) : (
            <p>{purchase_reason}</p>
          )}
        </>
      )}
      {target_category && (
        <p>
          <strong>Target Category:</strong> {Array.isArray(target_category) ? target_category.join(", ") : target_category}
        </p>
      )}
      {decision_making_style && <p><strong>Decision Making Style:</strong> {decision_making_style}</p>}
      {general_preference && <p><strong>General Preference:</strong> {general_preference}</p>}
      {dialogue_openness && <p><strong>Dialogue Openness:</strong> {dialogue_openness}</p>}
    </div>
  );
};

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
// above the main content.
// For messages starting with the header "Here are some items that you might like:"
// the content is parsed using "Item No." as a delimiter and the allowed keys are:
// "Item Title", "Item ID", "Price", "Category Path", and "Description".
//
const AgentMessage = ({ message, globalShowReasoning }) => {
  const [localShowDetails, setLocalShowDetails] = useState(false);
  const toggleLocalDetails = useCallback(() => setLocalShowDetails(prev => !prev), []);
  const finalShowDetails = globalShowReasoning || localShowDetails;

  const header = "Here are some items that you might like:";

  // NEW PARSING FUNCTION using "Item No." as a delimiter.
  const parseItemSuggestions = (text) => {
    // Split text into item blocks based on the "Item No." marker.
    const itemBlocks = text.split(/Item No\.\d+\s*:/).filter(block => block.trim() !== "");

    // Allowed keys to extract.
    const allowedKeys = new Set(["Item Title", "Item ID", "Price", "Category Path", "Description"]);

    const items = itemBlocks.map(block => {
      // Optional normalization: Ensure a delimiter exists between fields if needed.
      block = block.replace(/(Price:\s*\$\d+\.\d+)\s*(Category Path:)/, "$1 / $2");
      // Split the block into parts using " / " as a separator.
      const parts = block.split(" / ").map(part => part.trim()).filter(Boolean);

      const attributes = {};
      parts.forEach(part => {
        const colonIndex = part.indexOf(":");
        if (colonIndex !== -1) {
          const key = part.slice(0, colonIndex).trim();
          const value = part.slice(colonIndex + 1).trim();
          if (allowedKeys.has(key)) {
            attributes[key] = value;
          }
        }
      });
      return attributes;
    });
    return items;
  };

  // Helper function: Render the utterance.
  const renderUtterance = () => {
    if (message.content.startsWith(header)) {
      // Remove the header and trim the remaining text.
      const itemsPart = message.content.slice(header.length).trim();
      const items = parseItemSuggestions(itemsPart);

      return (
        <>
          <p className="utterance-header">{header}</p>
          <ul className="utterance-list">
            {items.map((item, idx) => (
              <li key={idx}>
                <p><strong>Item {idx + 1}</strong></p>
                <ul className="item-attributes">
                  {Object.entries(item).map(([key, value]) => (
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
      // For non-item suggestion content, split by newlines.
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
// Expects a JSON object with keys "user_data", "thoughts", "actions", and "conversation".
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
      
      {/* Render the user data card if available */}
      {parsedData.user_data && <UserDataCard userData={parsedData.user_data} />}

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
