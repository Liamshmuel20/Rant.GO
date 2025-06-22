import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { locations } from '@/components/locations';
import { Search, MapPin, X } from 'lucide-react';

export default function LocationSearch({ value, onChange, placeholder = "חפש אזור...", label = "אזור" }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (searchTerm.length > 0) {
      const filtered = locations.filter(location =>
        location.includes(searchTerm)
      );
      setFilteredLocations(filtered.slice(0, 10)); // הגבל ל-10 תוצאות
      setIsOpen(true);
    } else {
      setFilteredLocations([]);
      setIsOpen(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLocationSelect = (location) => {
    onChange(location);
    setSearchTerm('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    onChange("הכל");
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Label className="font-semibold mb-2 block text-center md:text-right">{label}</Label>
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={value === "הכל" ? placeholder : value}
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={() => searchTerm && setIsOpen(true)}
              className="pr-10 pl-3"
            />
          </div>
          {value !== "הכל" && (
            <button
              onClick={handleClear}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              title="נקה בחירה"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Current Selection */}
        {value !== "הכל" && !isOpen && (
          <div className="mt-2 flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
            <MapPin className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">{value}</span>
          </div>
        )}

        {/* Dropdown */}
        {isOpen && filteredLocations.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            <div className="p-2">
              <div 
                className="p-2 hover:bg-orange-50 cursor-pointer rounded-lg flex items-center gap-2 text-sm"
                onClick={() => handleLocationSelect("הכל")}
              >
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>כל האזורים</span>
              </div>
              {filteredLocations.map((location, index) => (
                <div
                  key={index}
                  className="p-2 hover:bg-orange-50 cursor-pointer rounded-lg flex items-center gap-2 text-sm"
                  onClick={() => handleLocationSelect(location)}
                >
                  <MapPin className="w-4 h-4 text-orange-600" />
                  <span>{location}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}