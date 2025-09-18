'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

interface DonutChartProps {
  score: number;
  size?: number;
}

export default function DonutChart({ score, size = 200 }: DonutChartProps) {
  const data = [
    { name: 'Score', value: score, color: getScoreColor(score) },
    { name: 'Remaining', value: 100 - score, color: '#f3f4f6' }
  ];

  function getScoreColor(score: number) {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // yellow
    if (score >= 40) return '#f97316'; // orange
    return '#ef4444'; // red
  }

  function getScoreStatus(score: number) {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Work';
    return 'Poor';
  }

  return (
    <div className="relative flex flex-col items-center">
      <ResponsiveContainer width={size} height={size}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            startAngle={90}
            endAngle={450}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Score in center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-4xl font-bold"
          style={{ color: getScoreColor(score) }}
        >
          {score}
        </motion.div>
        <div className="text-sm text-gray-600 font-medium">
          {getScoreStatus(score)}
        </div>
      </div>
    </div>
  );
}