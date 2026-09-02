'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Globe,
  Smartphone,
  Cloud,
  Split,
  Shield,
  Server,
  Cpu,
  Cog,
  Zap,
  Layers,
  Database,
  Table,
  HardDrive,
  Search,
  Mail,
  Activity,
  Gauge,
  AlertTriangle,
  Info,
  Plus,
  X,
} from 'lucide-react';
import { COMPONENT_TEMPLATES } from '@/lib/system-design/canvas-presets';
import type { ComponentCategory, ComponentTemplate } from '@/lib/system-design/canvas-types';

interface ComponentPaletteProps {
  onAddComponent: (template: ComponentTemplate) => void;
  onClose?: () => void;
}

const CATEGORY_NAMES: Record<ComponentCategory, string> = {
  client: 'Clients & Apps',
  edge: 'Edge & Ingress',
  compute: 'Compute & Services',
  cache: 'In-Memory & Cache',
  database: 'Data Stores & Storage',
  queue: 'Queues & Streaming',
  reliability: 'Reliability & Defense',
};

const CATEGORIES: ComponentCategory[] = [
  'client',
  'edge',
  'compute',
  'cache',
  'database',
  'queue',
  'reliability',
];

export function renderPaletteIcon(iconName: string, className = 'w-4 h-4') {
  switch (iconName) {
    case 'globe':
      return <Globe className={className} />;
    case 'smartphone':
      return <Smartphone className={className} />;
    case 'cloud':
      return <Cloud className={className} />;
    case 'split':
      return <Split className={className} />;
    case 'shield':
      return <Shield className={className} />;
    case 'server':
      return <Server className={className} />;
    case 'cpu':
      return <Cpu className={className} />;
    case 'cog':
      return <Cog className={className} />;
    case 'zap':
      return <Zap className={className} />;
    case 'layers':
      return <Layers className={className} />;
    case 'database':
      return <Database className={className} />;
    case 'table':
      return <Table className={className} />;
    case 'hard-drive':
      return <HardDrive className={className} />;
    case 'search':
      return <Search className={className} />;
    case 'mail':
      return <Mail className={className} />;
    case 'activity':
      return <Activity className={className} />;
    case 'gauge':
      return <Gauge className={className} />;
    case 'shield-alert':
    case 'alert-triangle':
      return <AlertTriangle className={className} />;
    default:
      return <Server className={className} />;
  }
}

export function ComponentPalette({ onAddComponent, onClose }: ComponentPaletteProps) {
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory>('client');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = COMPONENT_TEMPLATES.filter((t) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && (searchQuery.trim() !== '' || t.category === selectedCategory);
  });

  return (
    <aside className="flex flex-col h-full bg-surface border-r border-border-strong w-72 shrink-0 select-none z-10">
      {/* Header */}
      <div className="p-3 border-b border-border-strong flex flex-col gap-2 bg-surface-muted/30 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Architecture Palette
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-2xs text-foreground-muted bg-surface px-1.5 py-0.5 rounded-xs border border-border-subtle font-mono">
              {COMPONENT_TEMPLATES.length} Items
            </span>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Hide Palette"
                className="p-1 rounded-xs hover:bg-surface text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        <input
          type="text"
          placeholder="Filter components..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs px-2.5 py-1.5 bg-background border border-border-subtle rounded-xs text-foreground placeholder:text-foreground-muted/60 focus:outline-none focus:border-link"
        />
      </div>

      {/* Horizontal Category Tabs */}
      {searchQuery.trim() === '' && (
        <div className="flex gap-1 p-2 border-b border-border-subtle overflow-x-auto bg-surface-muted/20 shrink-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-1 text-xs rounded-xs whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-accent font-semibold text-accent-foreground shadow-xs'
                  : 'text-foreground-muted hover:text-foreground hover:bg-surface'
              }`}
            >
              {CATEGORY_NAMES[cat]}
            </button>
          ))}
        </div>
      )}

      {/* Vertically Listed Cards with Balanced Legible Typography */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {filteredTemplates.map((template) => (
          <div
            key={template.type}
            className="group relative flex flex-col gap-1.5 p-2.5 rounded-xs border border-border-subtle bg-surface hover:border-border-strong transition-all cursor-pointer hover:shadow-xs"
            onClick={() => onAddComponent(template)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-xs bg-surface-muted text-link">
                  {renderPaletteIcon(template.icon, 'w-3.5 h-3.5')}
                </span>
                <span className="text-xs font-semibold text-foreground">{template.label}</span>
              </div>
              <button
                type="button"
                aria-label={`Add ${template.label}`}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded-xs bg-accent text-accent-foreground text-xs transition-opacity cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-2xs text-foreground-muted line-clamp-2 leading-relaxed">
              {template.description}
            </p>

            {template.conceptSlug && (
              <div className="flex items-center justify-between pt-1 border-t border-border-subtle/50 text-2xs">
                <Link
                  href={`/learn/system-design#${template.conceptSlug}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-link hover:underline cursor-pointer"
                >
                  <Info className="w-3 h-3" />
                  <span>Concept reference</span>
                </Link>
                <span className="text-foreground-muted/60 font-mono text-2xs">
                  {template.defaultMetrics?.qps ? `${template.defaultMetrics.qps.toLocaleString()} QPS` : ''}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
