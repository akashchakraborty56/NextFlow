import os
content = """'use client';
import { useCallback, useState } from 'react';
import { NODE_REGISTRY } from '@/lib/node-registry';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';
import { Type, ImagePlus, Video, Brain, Crop, Film, Search } from 'lucide-react';
import type { NodeType } from '@/types/nodes';

const iconMap = { Type, ImagePlus, VideoIcon: Video, Brain, Crop, Film };

const colorBorder = {
  amber: 'border-amber-500/30 hover:border-amber-500/60',
  blue: 'border-blue-500/30 hover:border-blue-500/60',
  purple: 'border-purple-500/30 hover:border-purple-500/60',
  red: 'border-red-500/30 hover:border-red-500/60',
  emerald: 'border-emerald-500/30 hover:border-emerald-500/60',
};

const colorIcon = {
  amber: 'text-amber-400', blue: 'text-blue-400', purple: 'text-purple-400',
  red: 'text-red-400', emerald: 'text-emerald-400',
};

export function LeftSidebar() {
  const isOpen = useStore((s) => s.leftSidebarOpen);
  const [search, setSearch] = useState('');

  const onDragStart = useCallback((event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/nextflow-node', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  return (
    <div className={cn('relative flex flex-col bg-zinc-900/95 border-r border-zinc-800 transition-all duration-300', isOpen ? 'w-56' : 'w-0 overflow-hidden')}>
      <div className="p-3 border-b border-zinc-800 space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nodes</h3>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} type="text" placeholder="Search nodes..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors" />
        </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0">
        {Object.values(NODE_REGISTRY).filter((def) => def.label.toLowerCase().includes(search.toLowerCase()) || def.description.toLowerCase().includes(search.toLowerCase())).map((def) => {
          const Icon = iconMap[def.icon] ?? Type;
          return (
            <div key={def.type} draggable onDragStart={(e) => onDragStart(e, def.type)}
              className={cn('flex items-center gap-2.5 px-3 py-2.5 rounded-lg border bg-zinc-800/50 cursor-grab active:cursor-grabbing transition-all', colorBorder[def.color])}>
              <Icon size={16} className={colorIcon[def.color]} />
              <div>
                <p className="text-xs font-medium text-zinc-200">{def.label}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">{def.description}</p>
              </div>
          );
        })}
      </div>
  );
}
"""

with open("src/components/panels/left-sidebar.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("done")
