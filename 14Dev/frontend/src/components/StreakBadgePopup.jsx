import { useEffect, useState } from 'react';
import { Trophy, X, Sparkles } from 'lucide-react';

const StreakBadgePopup = ({ isOpen, onClose, dayNumber, currentStreak }) => {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowAnimation(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`relative bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-500 ${
        showAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Content */}
        <div className="text-center space-y-6">
          {/* Trophy Icon */}
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-white/30 rounded-full blur-xl animate-pulse"></div>
            <Trophy className="w-24 h-24 text-white relative z-10 animate-bounce" />
          </div>

          {/* Congratulations Text */}
          <div className="space-y-2">
            <h2 className="text-4xl font-bold text-white drop-shadow-lg">
              🎉 Congratulations! 🎉
            </h2>
            <p className="text-xl text-white/90 font-semibold">
              Daily Challenge Completed!
            </p>
          </div>

          {/* Badge */}
          <div className="bg-white/20 backdrop-blur-md rounded-xl p-6 border-2 border-white/30">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Sparkles className="w-8 h-8 text-yellow-300" />
              <span className="text-3xl font-bold text-white">
                Day {dayNumber} Streak Completed!
              </span>
              <Sparkles className="w-8 h-8 text-yellow-300" />
            </div>
            <div className="text-white/90 text-lg">
              Your current streak: <span className="font-bold text-yellow-300">{currentStreak} days</span>
            </div>
          </div>

          {/* Motivational Message */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <p className="text-white/90 text-sm">
              {currentStreak === 1 && "🌟 Great start! Keep the momentum going!"}
              {currentStreak === 2 && "🔥 Two days in a row! You're on fire!"}
              {currentStreak === 3 && "💪 Three days strong! Consistency is key!"}
              {currentStreak >= 4 && currentStreak < 7 && "🚀 Amazing streak! You're building great habits!"}
              {currentStreak >= 7 && currentStreak < 14 && "⭐ A week strong! You're unstoppable!"}
              {currentStreak >= 14 && currentStreak < 30 && "🏆 Two weeks! You're a coding champion!"}
              {currentStreak >= 30 && "👑 A month of dedication! You're legendary!"}
            </p>
          </div>

          {/* Continue Button */}
          <button
            onClick={onClose}
            className="w-full bg-white text-orange-600 font-bold py-3 px-6 rounded-xl hover:bg-white/90 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Continue Coding
          </button>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-yellow-300/20 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-orange-300/20 rounded-full blur-2xl"></div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default StreakBadgePopup;

