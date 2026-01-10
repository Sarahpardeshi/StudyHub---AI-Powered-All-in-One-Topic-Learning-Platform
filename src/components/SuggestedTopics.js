import React from "react";
import "./SuggestedTopics.css";

const DEFAULT_TOPICS = ["Machine Learning", "React Basics", "Data Structures"];

function SuggestedTopics({ onSelectTopic }) {
  return (
    <div className="suggested-root">
      {DEFAULT_TOPICS.map((topic) => (
        <button
          key={topic}
          className="suggested-chip"
          onClick={() => onSelectTopic(topic)}
        >
          {topic}
        </button>
      ))}
    </div>
  );
}

export default SuggestedTopics;
