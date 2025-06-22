import React from 'react';
import { Star } from 'lucide-react';

export default function StarRating({ rating, setRating, interactive = true }) {
  return (
    <div className="flex items-center" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-6 h-6 transition-all duration-200 ${
            rating >= star ? 'text-yellow-400 fill-current' : 'text-gray-300'
          } ${interactive ? 'cursor-pointer hover:scale-110' : ''}`}
          onClick={() => interactive && setRating(star)}
        />
      ))}
    </div>
  );
}