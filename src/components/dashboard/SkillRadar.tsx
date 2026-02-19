
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain, Info } from "lucide-react";

interface SkillRadarProps {
  data?: {
    subject: string;
    A: number;
    fullMark: number;
  }[];
}

// Default mock data if none provided
const defaultData = [
  { subject: "Confidence", A: 65, fullMark: 100 },
  { subject: "Technical", A: 45, fullMark: 100 },
  { subject: "ATS Score", A: 85, fullMark: 100 },
  { subject: "Problem Solving", A: 90, fullMark: 100 },
  { subject: "Communication", A: 70, fullMark: 100 },
];

export const SkillRadar = ({ data = defaultData }: SkillRadarProps) => {
  return (
    <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-300 group">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
                <Brain className="w-4 h-4 text-violet-500" />
                AI Competency Map
            </CardTitle>
            <Info className="w-4 h-4 text-muted-foreground/50 cursor-pointer hover:text-violet-500 transition-colors" />
        </div>
        <CardDescription className="text-xs">
            Visual breakdown of your interview skills.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-[250px] w-full mt-2 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid stroke="var(--border)" strokeOpacity={0.5} />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: 'white', fontSize: 11, fontWeight: 600 }} 
              />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="My Skills"
                dataKey="A"
                stroke="#8b5cf6" // Violet-500
                strokeWidth={2}
                fill="#8b5cf6"
                fillOpacity={0.2}
              />
              <Tooltip 
                contentStyle={{ 
                    backgroundColor: 'var(--popover)', 
                    borderColor: 'var(--border)', 
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                itemStyle={{ color: 'var(--foreground)' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-violet-500/20 border border-violet-500" />
                <span>Current Level</span>
            </div>
             <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full border border-dashed border-muted-foreground/50" />
                <span>Goal</span>
            </div>
        </div>
      </CardContent>
    </Card>
  );
};
