import React from 'react';

export const BranchBadge = ({ branch, showName = false }) => {
  if (!branch) return null;

  return (
    <span className="inline-flex items-center gap-2.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded text-sm font-mono font-semibold text-slate-700">
      <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
      {showName && <span className="font-sans font-medium text-slate-900">{branch.name}</span>}
      <span className="text-slate-800">{branch.code}</span>
    </span>
  );
};

export default BranchBadge;
