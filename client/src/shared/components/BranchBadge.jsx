import React from 'react';

export const BranchBadge = ({ branch }) => {
  if (!branch) return null;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700">
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
      <span>{branch.name}</span>
      <span className="bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-mono">
        {branch.code}
      </span>
    </div>
  );
};

export default BranchBadge;
