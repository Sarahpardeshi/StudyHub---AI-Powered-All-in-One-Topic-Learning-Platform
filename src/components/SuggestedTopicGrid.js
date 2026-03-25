import React from "react";
import { motion } from "framer-motion";
import { GraduationCap, Code, Atom, Brain, ChartBar, Globe, Database, Cpu } from "lucide-react";

const TOPIC_ICONS = {
    "Machine Learning": <Brain size={24} />,
    "Data Structures": <Code size={24} />,
    "Quantum Physics": <Atom size={24} />,
    "Modern History": <Globe size={24} />,
    "Economics": <ChartBar size={24} />,
    "Psychology": <GraduationCap size={24} />,
    "Cloud Computing": <Database size={24} />,
    "Cybersecurity": <Cpu size={24} />,
    // Default
    "Educational": <GraduationCap size={24} />
};

export function SuggestedTopicGrid({ topics, onTopicClick }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 py-8">
            {topics.map((topic, index) => (
                <motion.button
                    key={topic}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => onTopicClick(topic)}
                    className="group relative flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-[var(--primary)] transition-all overflow-hidden"
                >
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:rotate-6"
                        style={{ backgroundColor: 'var(--primary-soft)', color: 'var(--primary)' }}
                    >
                        {TOPIC_ICONS[topic] || TOPIC_ICONS["Educational"]}
                    </div>
                    <h3 className="text-sm font-bold text-center text-slate-800 dark:text-slate-100 group-hover:text-[var(--primary)]">
                        {topic}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-semibold">
                        Study Module
                    </p>

                    {/* Subtle background glow on hover */}
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-[var(--primary)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                </motion.button>
            ))}
        </div>
    );
}
