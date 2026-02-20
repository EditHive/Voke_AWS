import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";

export const UpgradeButton = () => {
    const navigate = useNavigate();
    return (
        <Button 
            size="sm" 
            onClick={() => navigate('/pricing')}
            className="hidden sm:flex relative overflow-hidden bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all duration-300 group"
        >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
            <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
                <Zap className="w-3.5 h-3.5 mr-2 fill-white" />
            </motion.div>
            <span className="relative font-semibold tracking-wide">Upgrade to Pro</span>
        </Button>
    );
};
