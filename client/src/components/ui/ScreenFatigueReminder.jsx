import React, { useState, useEffect } from 'react';
import { Button } from './button';
import { X, Eye, Monitor, Clock, Zap } from 'lucide-react';

const SCREEN_FATIGUE_TIPS = [
    {
        title: "Follow the 20-20-20 Rule",
        description: "Every 20 minutes, look at something 20 feet away for at least 20 seconds to relax your eye muscles.",
        icon: Eye,
        gradient: "from-blue-500 to-blue-600",
        iconBg: "bg-primary/20",
        accent: "primary"
    },
    {
        title: "Adjust Your Screen Brightness",
        description: "Match your screen brightness to your surroundings. Too bright or too dim can strain your eyes.",
        icon: Monitor,
        gradient: "from-indigo-500 to-indigo-600",
        iconBg: "bg-primary/20",
        accent: "primary"
    },
    {
        title: "Take Regular Breaks",
        description: "Stand up, stretch, and walk around for 5-10 minutes every hour to reduce eye strain and improve circulation.",
        icon: Clock,
        gradient: "from-emerald-500 to-emerald-600",
        iconBg: "bg-primary/20",
        accent: "primary"
    },
    {
        title: "Blink More Frequently",
        description: "Remember to blink! When focused on screens, we blink less, causing dry eyes. Make conscious efforts to blink.",
        icon: Eye,
        gradient: "from-violet-500 to-violet-600",
        iconBg: "bg-primary/20",
        accent: "primary"
    },
    {
        title: "Optimize Your Workspace",
        description: "Position your screen 20-26 inches away, with the top at or below eye level to reduce neck strain.",
        icon: Monitor,
        gradient: "from-teal-500 to-teal-600",
        iconBg: "bg-primary/20",
        accent: "primary"
    },
    {
        title: "Use Proper Lighting",
        description: "Avoid glare by positioning your screen perpendicular to windows and use ambient lighting to reduce contrast.",
        icon: Zap,
        gradient: "from-amber-500 to-amber-600",
        iconBg: "bg-primary/20",
        accent: "primary"
    }
];

export function ScreenFatigueReminder() {
    const [isVisible, setIsVisible] = useState(false);
    const [currentTip, setCurrentTip] = useState(0);
    const [lastShown, setLastShown] = useState(null);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        // Check if user has seen a reminder recently (within last 6 minutes)
        const lastReminderTime = localStorage.getItem('screenFatigueLastShown');
        const now = Date.now();

        if (lastReminderTime) {
            const timeSinceLastReminder = now - parseInt(lastReminderTime);
            // If less than 6 minutes have passed, set a shorter timer
            if (timeSinceLastReminder < 6 * 60 * 1000) {
                const remainingTime = (7 * 60 * 1000) - timeSinceLastReminder;
                setTimeout(() => showReminder(), remainingTime);
                return;
            }
        }

        // Set 7-minute timer
        const timer = setTimeout(() => {
            showReminder();
        }, 7 * 60 * 1000); // 7 minutes

        return () => clearTimeout(timer);
    }, []);

    // Auto-cycle through tips every 10 seconds when visible
    useEffect(() => {
        if (!isVisible) return;

        const interval = setInterval(() => {
            setIsTransitioning(true);

            setTimeout(() => {
                setCurrentTip((prev) => (prev + 1) % SCREEN_FATIGUE_TIPS.length);
                setIsTransitioning(false);
            }, 150); // Half of transition duration
        }, 10000); // 10 seconds

        return () => clearInterval(interval);
    }, [isVisible]);

    const showReminder = () => {
        // Select a random tip
        const randomTipIndex = Math.floor(Math.random() * SCREEN_FATIGUE_TIPS.length);
        setCurrentTip(randomTipIndex);
        setIsVisible(true);

        // Store the current time
        const now = Date.now();
        setLastShown(now);
        localStorage.setItem('screenFatigueLastShown', now.toString());
    };

    const handleClose = () => {
        setIsVisible(false);

        // Set next reminder for 7 minutes from now
        setTimeout(() => {
            showReminder();
        }, 7 * 60 * 1000);
    };

    const handleTakeBreak = () => {
        setIsVisible(false);

        // Show a brief "taking break" message
        setTimeout(() => {
            alert("Great! Take a 5-10 minute break. Walk around, hydrate, and rest your eyes. 👀✨");
        }, 100);

        // Set next reminder for 7 minutes from now
        setTimeout(() => {
            showReminder();
        }, 7 * 60 * 1000);
    };

    const handleNextTip = () => {
        setIsTransitioning(true);

        setTimeout(() => {
            setCurrentTip((prev) => (prev + 1) % SCREEN_FATIGUE_TIPS.length);
            setIsTransitioning(false);
        }, 150);
    };

    if (!isVisible) return null;

    const tip = SCREEN_FATIGUE_TIPS[currentTip];
    const IconComponent = tip.icon;

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-black/30 via-black/50 to-black/70 backdrop-blur-md flex items-center justify-center z-[999] p-4 animate-in fade-in duration-500">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-white/20 animate-in slide-in-from-bottom-8 zoom-in-95 duration-700 ease-out">
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50"></div>

                {/* Header with modern gradient */}
                <div className={`bg-gradient-to-br ${tip.gradient} p-8 text-white relative overflow-hidden transition-all duration-300 ease-in-out ${isTransitioning ? 'opacity-75 scale-95' : 'opacity-100 scale-100'}`}>
                    {/* Animated background elements */}
                    <div className="absolute -top-10 -right-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
                    <div className="absolute -bottom-5 -left-5 w-16 h-16 bg-white/5 rounded-full blur-lg animate-pulse delay-300"></div>

                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-all duration-300 hover:scale-110 hover:rotate-90 group"
                    >
                        <X className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                    </button>

                    <div className="flex items-center gap-4 mb-2 relative z-10">
                        <div className="flex-1">
                            <h2 className="text-xl font-bold mb-1 tracking-tight text-white">Screen Fatigue Reminder</h2>
                            <p className="text-white/90 text-sm font-medium">Time for a healthy break!</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 relative z-10">
                    <div className="space-y-6">
                        <div className={`text-center space-y-3 transition-all duration-300 ease-in-out ${isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
                            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                                {tip.title}
                            </h3>
                            <p className="text-gray-600 leading-relaxed text-base">
                                {tip.description}
                            </p>
                        </div>

                        {/* Action buttons */}
                        <div className={`space-y-4 transition-all duration-300 ease-in-out ${isTransitioning ? 'opacity-75' : 'opacity-100'}`}>
                            <Button
                                onClick={handleTakeBreak}
                                className={`w-full bg-gradient-to-r ${tip.gradient} hover:scale-105 active:scale-95 text-white shadow-xl hover:shadow-2xl transition-all duration-300 h-14 text-lg font-semibold rounded-2xl border-0 relative overflow-hidden group cursor-pointer`}
                            >
                                {/* Button shine effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                <Clock className="h-5 w-5 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                                Take a Break Now ✨
                            </Button>

                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="outline"
                                    onClick={handleNextTip}
                                    className="h-12 rounded-xl border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 hover:scale-105 transition-all duration-300 font-bold cursor-pointer"
                                >
                                    Next Tip
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={handleClose}
                                    className="h-12 rounded-xl hover:bg-gray-100 hover:scale-105 transition-all duration-300 font-bold cursor-pointer border-2 border-gray-200"
                                >
                                    Later
                                </Button>
                            </div>
                        </div>

                        {/* Enhanced tip counter */}
                        <div className="text-center space-y-3 animate-in fade-in duration-500 delay-500">
                            <p className="text-sm font-medium text-gray-500">
                                Health Tip {currentTip + 1} of {SCREEN_FATIGUE_TIPS.length}
                            </p>
                            <div className="flex justify-center gap-2">
                                {SCREEN_FATIGUE_TIPS.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`h-2 rounded-full transition-all duration-500 ease-out ${index === currentTip
                                            ? 'bg-gradient-to-r from-primary to-blue-500 w-8 shadow-lg'
                                            : 'bg-gray-300 w-2 hover:bg-gray-400'
                                            }`}
                                        style={{
                                            transitionDelay: `${index * 50}ms`
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Motivational quote */}
                        <div className="text-center mt-6 p-4 bg-gradient-to-r from-primary/5 to-blue-500/5 rounded-2xl border border-primary/10 animate-in slide-in-from-bottom duration-500 delay-600">
                            <p className="text-sm text-gray-600 italic font-medium">
                                "Your eyes are precious - take care of them! 👁️✨"
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}