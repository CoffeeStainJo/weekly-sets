import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Minus, Trash2, Dumbbell } from 'lucide-react';

// Helper function to get the start of the current week (Monday)
const getWeekStartDate = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff)).setHours(0, 0, 0, 0);
};

// Helper function to format the date range for the current week
const getWeekDateRange = () => {
  const today = new Date();
  const startOfWeek = new Date(getWeekStartDate(today));
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);

  const options = { month: 'short', day: 'numeric' };
  const startDate = startOfWeek.toLocaleDateString('en-US', options);
  const endDate = endOfWeek.toLocaleDateString('en-US', options);

  return `${startDate} - ${endDate}`;
};


// Main App Component
export default function App() {
  const [bodyParts, setBodyParts] = useState([]);
  const [newBodyPart, setNewBodyPart] = useState('');
  const MIN_GOAL = 15;
  const MAX_GOAL = 20;

  // --- LOCAL STORAGE & WEEKLY RESET ---
  // This effect runs once on component mount to initialize state from local storage
  // and handle the weekly reset logic.
  useEffect(() => {
    try {
      const storedData = localStorage.getItem('strengthTrackerData');
      const storedWeekStart = localStorage.getItem('strengthTrackerWeekStart');
      const currentWeekStart = getWeekStartDate(new Date());

      if (storedData && storedWeekStart && parseInt(storedWeekStart, 10) === currentWeekStart) {
        setBodyParts(JSON.parse(storedData));
      } else {
        // If it's a new week or no data exists, reset everything.
        setBodyParts([
          { id: 1, name: 'Chest', sets: 0 },
          { id: 2, name: 'Back', sets: 0 },
          { id: 3, name: 'Legs', sets: 0 },
          { id: 4, name: 'Shoulders', sets: 0 },
        ]);
        localStorage.setItem('strengthTrackerWeekStart', currentWeekStart.toString());
      }
    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
      // Set to default state if localStorage data is corrupted
      setBodyParts([
        { id: 1, name: 'Chest', sets: 0 },
        { id: 2, name: 'Back', sets: 0 },
        { id: 3, name: 'Legs', sets: 0 },
        { id: 4, name: 'Shoulders', sets: 0 },
      ]);
    }
  }, []);

  // This effect runs whenever the `bodyParts` state changes, saving it to local storage.
  useEffect(() => {
    localStorage.setItem('strengthTrackerData', JSON.stringify(bodyParts));
  }, [bodyParts]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available, notify user
                if (confirm('New version available! Would you like to update?')) {
                  window.location.reload();
                }
              }
            });
          });
        })
        .catch(error => console.log('Service worker registration failed:', error));
    }
  }, []);

  // --- EVENT HANDLERS ---
  const handleAddBodyPart = (e) => {
    e.preventDefault();
    if (newBodyPart.trim() && !bodyParts.some(part => part.name.toLowerCase() === newBodyPart.trim().toLowerCase())) {
      const newPart = {
        id: Date.now(),
        name: newBodyPart.trim(),
        sets: 0,
      };
      setBodyParts([...bodyParts, newPart]);
      setNewBodyPart('');
    }
  };

  const handleSetChange = (id, delta) => {
    setBodyParts(bodyParts.map(part => {
      if (part.id === id) {
        const newSets = part.sets + delta;
        return { ...part, sets: Math.max(0, newSets) }; // Ensure sets don't go below 0
      }
      return part;
    }));
  };

  const handleDeleteBodyPart = (id) => {
    setBodyParts(bodyParts.filter(part => part.id !== id));
  };

  // --- DYNAMIC STYLING ---
  const getProgressColor = (sets) => {
    if (sets >= MIN_GOAL) return 'from-teal-400 to-green-500'; // Goal met or exceeded
    if (sets > 10) return 'from-cyan-400 to-blue-500'; // Getting close
    return 'from-purple-400 to-indigo-500'; // Starting out
  };

  return (
    <div className="min-h-screen w-full bg-gray-900 text-white font-sans overflow-hidden">
      {/* Background Gradient Animation */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black -z-10"></div>
      {/* hide oversized decorative blobs on very small screens to avoid horizontal overflow */}
      <div className="hidden sm:block absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full filter blur-3xl animate-blob opacity-50"></div>
      <div className="hidden sm:block absolute top-1/2 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full filter blur-3xl animate-blob animation-delay-2000 opacity-50"></div>
      <div className="hidden sm:block absolute bottom-1/4 left-1/3 w-96 h-96 bg-teal-600/20 rounded-full filter blur-3xl animate-blob animation-delay-4000 opacity-50"></div>

      <main className="relative z-10 p-4 sm:p-6 md:p-8 max-w-xl sm:max-w-3xl mx-auto px-4">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3">
            <Dumbbell className="h-8 w-8 text-purple-300" />
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-blue-300">
              Weekly Sets
            </h1>
          </div>
          <p className="text-gray-400 mt-2">{getWeekDateRange()}</p>
          <p className="text-gray-300 mt-4 text-lg">Goal: <span className="font-bold text-white">{MIN_GOAL}-{MAX_GOAL}</span> sets per body part</p>
        </header>

        {/* Body Parts List */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bodyParts.map((part) => {
              const progressPercentage = Math.min((part.sets / MAX_GOAL) * 100, 100);
              return (
                <div key={part.id} className="group relative p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl transition-all duration-300 hover:bg-white/10 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-200">{part.name}</h3>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleSetChange(part.id, -1)} className="p-2 rounded-full bg-black/20 hover:bg-purple-500/50 transition-colors duration-200 disabled:opacity-50" disabled={part.sets === 0}>
                        <Minus className="h-5 w-5" />
                      </button>
                      <span className="text-xl sm:text-2xl font-bold w-10 text-center">{part.sets}</span>
                      <button onClick={() => handleSetChange(part.id, 1)} className="p-2 rounded-full bg-black/20 hover:bg-teal-500/50 transition-colors duration-200">
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="w-full bg-black/20 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full bg-gradient-to-r ${getProgressColor(part.sets)} transition-all duration-500 ease-out`}
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  {/* keep the trash button non-interactive until visible to prevent accidental taps */}
                  <button
                    onClick={() => handleDeleteBodyPart(part.id)}
                    className="absolute top-4 right-4 p-1 rounded-full text-gray-400 bg-black/10 opacity-0 group-hover:opacity-80 group-hover:pointer-events-auto pointer-events-none hover:bg-red-500/10 hover:text-red-300 transition-transform duration-150 transform scale-95 hover:scale-100 z-10"
                    aria-label={`Delete ${part.name}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        {/* Add New Body Part Form */}
        <section className="mt-8">
          <form onSubmit={handleAddBodyPart} className="flex gap-3 p-2 sm:p-3 bg-white/5 border border-white/10 rounded-full backdrop-blur-xl focus-within:ring-2 focus-within:ring-purple-400 transition-all">
            <input
              type="text"
              value={newBodyPart}
              onChange={(e) => setNewBodyPart(e.target.value)}
              placeholder="Add new body part..."
              className="w-full bg-transparent focus:outline-none px-3 text-base sm:text-lg placeholder-gray-500"
            />
            <button type="submit" className="p-2 sm:p-3 rounded-full bg-purple-500 hover:bg-purple-400 disabled:bg-gray-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-400" disabled={!newBodyPart.trim()}>
              <Plus className="h-6 w-6" />
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
