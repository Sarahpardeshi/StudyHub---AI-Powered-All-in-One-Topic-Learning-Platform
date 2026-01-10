import React, { useState } from "react";
import "./SearchBar.css";

function SearchBar({ onSearch }) {
  const [value, setValue] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSearch(value.trim());
  };

  return (
    <form className="searchbar-root" onSubmit={handleSubmit}>
      <input type="text" placeholder="Search a topic..." value={value} onChange={(e) => setValue(e.target.value)}/>
      <button type="submit">Go</button>
    </form>
  );
}

export default SearchBar;
