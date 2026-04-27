import React from 'react';

interface StatCardProps {
  label: string;
  value: number;
  color: string;
}

const colorMap: Record<string, string> = {
  white: 'text-white',
  amber: 'text-amber-400',
  green: 'text-green-400',
  red: 'text-red-400',
  blue: 'text-blue-400',
};

export const StatCard: React.FC<StatCardProps> = ({ label, value, color }) => {
  return (
    <div className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-800">
      <div className={`text-2xl font-bold ${colorMap[color] || 'text-white'}`}>{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
};
