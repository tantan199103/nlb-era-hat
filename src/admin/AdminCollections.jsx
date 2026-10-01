import React, { useState } from 'react';
import { 
  FolderPlus, Search, Edit3, Trash2, ExternalLink, Flame, 
  Layers, Check, X, Plus, Sparkles, Tag, SlidersHorizontal 
} from 'lucide-react';

export default function AdminCollections({ 
  collections, 
  products, 
  onSaveCollections, 
  onViewCollection 
}) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editingCollection, setEditingCollection] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notice, setNotice] = useState('');

  // Form state
  const [formState, setFormState] = useState({
    name: '',
    handle: '',
    description: '',
    hero: '',
    status: 'PUBLISHED',
    sort: 'Newest',
    automation: {
      enabled: true,
      includeKeywords: '',
      excludeKeywords: ''
    }
  });

  const filteredCollections = collections.filter(c => {
    const matchQuery = !query.trim() || 
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.handle.toLowerCase().includes(query.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(query.toLowerCase()));
    
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchQuery && matchStatus;
  });

  const handleOpenAddModal = () => {
    setEditingCollection(null);
    setFormState({
      name: 'New Era Fall Classics Limited 59FIFTY',
      handle: 'fall-classics-limited-59fifty',
      description: 'Exclusive postseason colorways with metallic pins and side patch embroidery.',
      hero: 'https://www.lidshd.com/cdn/shop/files/qvqqbxpnd7__bannerDesk__LHD_Chicago_Sole_Web_banner_2000x878_4fc7ecd9-876d-4424-91d1-5aa6992ad77c.jpg?v=1790566841&width=2000',
      status: 'PUBLISHED',
      sort: 'Newest',
      automation: {
        enabled: true,
        includeKeywords: 'classics, postseason, fall',
        excludeKeywords: 'sample'
      }
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (col) => {
    setEditingCollection(col);
    setFormState({
      name: col.name,
      handle: col.handle,
      description: col.description || '',
      hero: col.hero || '',
      status: col.status || 'PUBLISHED',
      sort: col.sort || 'Newest',
      automation: {
        enabled: col.automation?.enabled ?? true,
        includeKeywords: (col.automation?.includeKeywords || []).join(', '),
        excludeKeywords: (col.automation?.excludeKeywords || []).join(', ')
      }
    });
    setIsModalOpen(true);
  };

  const handleSaveModal = (e) => {
    e.preventDefault();
    if (!formState.name.trim()) return;

    const includeArray = formState.automation.includeKeywords
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(Boolean);

    const excludeArray = formState.automation.excludeKeywords
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(Boolean);

    // Calculate matched product count
    const matchedCount = products.filter(p => {
      const title = p.title.toLowerCase();
      const hasInclude = includeArray.length === 0 || includeArray.some(k => title.includes(k));
      const hasExclude = excludeArray.length > 0 && excludeArray.some(k => title.includes(k));
      return hasInclude && !hasExclude;
    }).length;

    let updatedCollections;
    if (editingCollection) {
      updatedCollections = collections.map(c => {
        if (c.id === editingCollection.id) {
          return {
            ...c,
            name: formState.name,
            handle: formState.handle || formState.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            description: formState.description,
            hero: formState.hero,
            status: formState.status,
            sort: formState.sort,
            count: matchedCount > 0 ? matchedCount : (c.count || 4),
            automation: {
              enabled: formState.automation.enabled,
              includeKeywords: includeArray,
              excludeKeywords: excludeArray
            }
          };
        }
        return c;
      });
      setNotice(`Updated drop collection "${formState.name}"`);
    } else {
      const newCol = {
        id: `col-${Date.now()}`,
        name: formState.name,
        handle: formState.handle || formState.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: formState.description,
        hero: formState.hero,
        status: formState.status,
        sort: formState.sort,
        count: matchedCount > 0 ? matchedCount : 6,
        automation: {
          enabled: formState.automation.enabled,
          includeKeywords: includeArray,
          excludeKeywords: excludeArray
        }
      };
      updatedCollections = [newCol, ...collections];
      setNotice(`Created drop collection "${formState.name}"`);
    }

    onSaveCollections(updatedCollections);
    setIsModalOpen(false);
    setTimeout(() => setNotice(''), 3500);
  };

  const handleDeleteCollection = (id, name) => {
    if (window.confirm(`Are you sure you want to delete collection "${name}"?`)) {
      const updated = collections.filter(c => c.id !== id);
      onSaveCollections(updated);
      setNotice(`Deleted collection "${name}"`);
      setTimeout(() => setNotice(''), 3000);
    }
  };

  return (
    <div className="admin-content animate-fade-in space-y-6">
      {/* Intro Header */}
      <div className="admin-intro">
        <div>
          <div className="admin-intro-eyebrow">CATALOG & THEMES</div>
          <h1>CURATED DROPS & COLLECTIONS</h1>
          <p className="admin-intro-desc">
            Organize limited 59FIFTY releases into dynamic themed drops, hero banner showcases, and automated keyword matchers.
          </p>
        </div>

        <button 
          onClick={handleOpenAddModal}
          className="btn-flame text-xs py-2.5 px-4 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-900/30"
        >
          <FolderPlus size={16} />
          <span>+ CREATE NEW DROP</span>
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-red-950/50 border border-[#ff3b30]/50 rounded text-red-300 text-xs flex items-center gap-2 animate-fade-in">
          <Sparkles size={14} className="text-[#ff3b30]" />
          <span>{notice}</span>
        </div>
      )}

      {/* KPI stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="admin-panel !p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">Total Drops</div>
            <div className="text-2xl font-black text-white">{collections.length}</div>
          </div>
          <Layers className="text-[#ff3b30]" size={28} />
        </div>

        <div className="admin-panel !p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">Active Published</div>
            <div className="text-2xl font-black text-[#3ed660]">
              {collections.filter(c => c.status === 'PUBLISHED').length}
            </div>
          </div>
          <Flame className="text-[#3ed660]" size={28} />
        </div>

        <div className="admin-panel !p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">Auto-Matched Caps</div>
            <div className="text-2xl font-black text-white">
              {collections.reduce((sum, c) => sum + (c.count || 0), 0)} Caps
            </div>
          </div>
          <Tag className="text-amber-400" size={28} />
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-[#141414] p-3 rounded-lg border border-[#262626]">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input 
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search drops by name, handle, or theme..."
            className="w-full pl-9 pr-3 py-2 bg-[#0a0a0a] border border-[#262626] rounded text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff3b30]"
          />
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'PUBLISHED', 'DRAFT'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === status 
                  ? 'bg-[#ff3b30] text-white shadow-sm' 
                  : 'bg-[#1e1e1e] text-zinc-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCollections.map(col => (
          <div 
            key={col.id}
            className="admin-panel !p-0 overflow-hidden flex flex-col group hover:border-zinc-700 transition-all duration-200"
          >
            {/* Hero Image Thumbnail */}
            <div className="relative h-40 bg-zinc-900 overflow-hidden border-b border-[#262626]">
              {col.hero ? (
                <img 
                  src={col.hero} 
                  alt={col.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                  <Flame size={40} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase ${
                  col.status === 'PUBLISHED' 
                    ? 'bg-[#3ed660]/20 text-[#3ed660] border border-[#3ed660]/40' 
                    : 'bg-zinc-700/50 text-zinc-300 border border-zinc-600'
                }`}>
                  {col.status}
                </span>
                {col.automation?.enabled && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Sparkles size={10} /> Auto-Sync
                  </span>
                )}
              </div>

              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="text-base font-black text-white leading-tight uppercase truncate">
                  {col.name}
                </h3>
                <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                  /collections/{col.handle}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                {col.description || 'Exclusive curated fitted drop with limited edition side patches and custom team stitching.'}
              </p>

              {col.automation?.includeKeywords && col.automation.includeKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {col.automation.includeKeywords.map((kw, i) => (
                    <span key={i} className="text-[10px] bg-[#1a1a1a] text-zinc-400 px-2 py-0.5 rounded border border-[#2a2a2a]">
                      #{kw}
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-[#222] flex items-center justify-between text-xs text-zinc-400">
                <span className="font-bold text-white">
                  {col.count || 0} Fitted Hats
                </span>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => onViewCollection?.(col.handle)}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#222] rounded transition-colors cursor-pointer"
                    title="View on live storefront"
                  >
                    <ExternalLink size={14} />
                  </button>
                  <button 
                    onClick={() => handleOpenEditModal(col)}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#222] rounded transition-colors cursor-pointer"
                    title="Edit drop settings"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDeleteCollection(col.id, col.name)}
                    className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-950/30 rounded transition-colors cursor-pointer"
                    title="Delete drop collection"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCollections.length === 0 && (
        <div className="admin-empty">
          <Layers size={36} className="text-zinc-600 mb-2" />
          <h3 className="text-sm font-bold text-white uppercase">No Collections Found</h3>
          <p className="text-xs text-zinc-400">Try adjusting your query or create a new limited drop collection.</p>
        </div>
      )}

      {/* Add / Edit Collection Modal */}
      {isModalOpen && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal max-w-xl">
            <div className="admin-modal-header">
              <div className="flex items-center gap-2">
                <Flame className="text-[#ff3b30]" size={18} />
                <h3>{editingCollection ? 'EDIT DROP COLLECTION' : 'CREATE NEW DROP COLLECTION'}</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4">
              <div>
                <label className="admin-form-label">Drop Collection Title *</label>
                <input 
                  type="text"
                  required
                  value={formState.name}
                  onChange={e => setFormState({ ...formState, name: e.target.value })}
                  placeholder="e.g. MLB Playing with Fire 59FIFTY"
                  className="admin-form-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="admin-form-label">URL Slug / Handle</label>
                  <input 
                    type="text"
                    value={formState.handle}
                    onChange={e => setFormState({ ...formState, handle: e.target.value })}
                    placeholder="e.g. mlb-playing-with-fire"
                    className="admin-form-input font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="admin-form-label">Publish Status</label>
                  <select 
                    value={formState.status}
                    onChange={e => setFormState({ ...formState, status: e.target.value })}
                    className="admin-form-select"
                  >
                    <option value="PUBLISHED">PUBLISHED (Live)</option>
                    <option value="DRAFT">DRAFT (Hidden)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="admin-form-label">Hero Banner Image URL</label>
                <input 
                  type="url"
                  value={formState.hero}
                  onChange={e => setFormState({ ...formState, hero: e.target.value })}
                  placeholder="https://www.lidshd.com/cdn/shop/files/..."
                  className="admin-form-input text-xs font-mono"
                />
              </div>

              <div>
                <label className="admin-form-label">Description / Merchandising Story</label>
                <textarea 
                  rows={2}
                  value={formState.description}
                  onChange={e => setFormState({ ...formState, description: e.target.value })}
                  placeholder="Describe the drop theme, fabric details, special side patches, and inspiration..."
                  className="admin-form-textarea text-xs"
                />
              </div>

              {/* Automation Rules */}
              <div className="bg-[#141414] p-4 rounded-lg border border-[#2a2a2a] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-400">
                    <Sparkles size={14} />
                    <span>Automated Keyword Matching</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                    <input 
                      type="checkbox"
                      checked={formState.automation.enabled}
                      onChange={e => setFormState({
                        ...formState,
                        automation: { ...formState.automation, enabled: e.target.checked }
                      })}
                      className="accent-[#ff3b30]"
                    />
                    <span>Enable</span>
                  </label>
                </div>

                <div>
                  <label className="admin-form-label">Include Keywords (comma-separated)</label>
                  <input 
                    type="text"
                    value={formState.automation.includeKeywords}
                    onChange={e => setFormState({
                      ...formState,
                      automation: { ...formState.automation, includeKeywords: e.target.value }
                    })}
                    placeholder="fire, scorched, flame, red sox"
                    className="admin-form-input text-xs"
                  />
                  <span className="text-[10px] text-zinc-500 block mt-1">
                    Products with titles matching any of these keywords are automatically indexed into this drop.
                  </span>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-admin-cancel cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-admin-primary flex items-center gap-1.5 cursor-pointer"
                >
                  <Check size={16} />
                  <span>{editingCollection ? 'Save Collection' : 'Create Drop'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
