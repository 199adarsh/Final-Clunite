"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { COLLEGES, College } from "@/lib/colleges";
import { Check, GraduationCap } from "lucide-react";

interface CollegeAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  dropdownClassName?: string;
  required?: boolean;
  id?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  // Optional flag to allow partial search terms to stay on blur (e.g. for filters)
  allowPartialOnBlur?: boolean;
}

export function CollegeAutocomplete({
  value,
  onChange,
  placeholder = "Search and select your college...",
  className = "",
  dropdownClassName = "",
  required = false,
  id,
  leftIcon,
  rightIcon,
  allowPartialOnBlur = false
}: CollegeAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState<College[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal search query with external value prop
  useEffect(() => {
    setSearchQuery(value || "");
  }, [value]);

  // Update suggestions based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = COLLEGES.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.code.includes(query)
    ).slice(0, 15); // Limit suggestions to 15 for performance and neatness

    setSuggestions(filtered);
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        handleBlurValidation();
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchQuery]);

  const handleBlurValidation = () => {
    if (searchQuery.trim()) {
      const match = COLLEGES.find(
        (c) => c.name.toLowerCase() === searchQuery.toLowerCase()
      );
      if (match) {
        onChange(match.name);
        setSearchQuery(match.name);
      } else {
        if (allowPartialOnBlur) {
          // For filters, allow whatever is typed
          onChange(searchQuery);
        } else {
          // Enforce picking from the list: clear the field
          onChange("");
          setSearchQuery("");
        }
      }
    } else {
      onChange("");
    }
  };

  const handleSelect = (college: College) => {
    onChange(college.name);
    setSearchQuery(college.name);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      setActiveIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      if (isOpen && activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[activeIndex]);
      } else {
        handleBlurValidation();
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        {leftIcon}
        <Input
          id={id}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          required={required}
          className={`${className} ${leftIcon ? "pl-10" : ""} ${
            rightIcon === null ? "" : "pr-10"
          }`}
          autoComplete="off"
        />
        {rightIcon === null ? null : (
          rightIcon || (
            <GraduationCap className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
          )
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className={`absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto py-1.5 ${dropdownClassName}`}>
          {suggestions.map((college, index) => {
            const isSelected = value === college.name;
            const isActive = index === activeIndex;
            return (
              <div
                key={college.code}
                onClick={() => handleSelect(college)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex items-center justify-between px-3.5 py-2.5 text-sm transition-colors cursor-pointer text-left ${
                  isActive || isSelected ? "bg-indigo-50 text-indigo-900" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="font-medium truncate text-slate-900">{college.name}</span>
                  <span className="text-[10px] text-slate-500">Code: {college.code}</span>
                </div>
                {isSelected && (
                  <Check className="h-4 w-4 text-indigo-600 shrink-0 ml-2" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {isOpen && searchQuery.trim() && suggestions.length === 0 && (
        <div className={`absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-4 text-center text-sm text-slate-500 animate-in fade-in duration-200 ${dropdownClassName}`}>
          No matching colleges found. Please select from the list.
        </div>
      )}
    </div>
  );
}
