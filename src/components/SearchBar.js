import React, { useState } from "react";
import "./SearchBar.css";

function SearchBar({ onSearch, placeholder = "Search a topic...", variant = "default" }) {
  const [value, setValue] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSearch(value.trim());
  };

  return (
    <form className={`searchbar-root searchbar--${variant}`} onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="search-hint">
        <span className="hint-keys">⌘ K</span>
      </div>
      <button type="submit" style={{ display: 'none' }}>Go</button>
    </form>
  );
}

export default SearchBar;
