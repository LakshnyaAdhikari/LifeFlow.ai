"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface DomainCardProps {
    name: string;
    description: string;
    icon: LucideIcon;
    isSelected: boolean;
    isDimmed: boolean;
    onClick: () => void;
}

export default function DomainCard({
    name,
    description,
    icon: Icon,
    isSelected,
    isDimmed,
    onClick
}: DomainCardProps) {
    return (
        <motion.div
            layout
            onClick={onClick}
            className={`relative p-8 rounded-[2rem] cursor-pointer transition-all duration-300 border-2 group
                ${isSelected
                    ? "border-teal-500 bg-teal-950 shadow-xl z-20"
                    : "border-teal-500 bg-[#f0fdfa] dark:bg-teal-950/10 hover:bg-teal-950 dark:hover:bg-teal-900 shadow-sm"
                }
                ${isDimmed ? "opacity-20 blur-md pointer-events-none scale-95" : "opacity-100 blur-0"}
            `}
            whileHover={!isSelected && !isDimmed ? { scale: 1.03, y: -5 } : {}}
            animate={isSelected ? { scale: 1.05, y: -5 } : { scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
            <div className="flex flex-col items-center text-center space-y-4">
                <div className={`p-4 rounded-2xl transition-all duration-300 
                    ${isSelected ? "bg-teal-500/10" : "bg-teal-100/30 group-hover:bg-teal-500/10"}
                `}>
                    <Icon className={`w-8 h-8 transition-colors duration-300
                        ${isSelected ? "text-[#2dd4bf]" : "text-[#0f766e] group-hover:text-[#2dd4bf] dark:text-teal-400"}
                    `} />
                </div>

                <div className="space-y-2">
                    <h3 className={`text-xl font-bold tracking-tight transition-colors duration-300
                        ${isSelected ? "text-[#2dd4bf]" : "text-[#134e4a] group-hover:text-[#2dd4bf] dark:text-teal-100"}
                    `}>
                        {name}
                    </h3>
                </div>
            </div>

            {/* Selected Glow */}
            {isSelected && (
                <motion.div
                    layoutId="glow"
                    className="absolute inset-0 rounded-[2rem] bg-teal-400/10 -z-10 blur-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                />
            )}
        </motion.div>
    );
}
