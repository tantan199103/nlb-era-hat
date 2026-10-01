import React, { useState } from 'react';
import { 
  Menu as MenuIcon, Plus, Trash2, ChevronUp, ChevronDown, 
  Eye, Save, Link2, ExternalLink, ArrowRight, Check, Monitor, Smartphone 
} from 'lucide-react';

export default function AdminMenus({ menus, onSaveMenus, onViewStorefront }) {
  const [selectedMenuId, setSelectedMenuId] = useState(menus[0]?.id || 'menu-header');
  const [draftMenus, setDraftMenus] = useState(menus);
  const [saveNotice, setSaveNotice] = useState('');

  const currentMenu = draftMenus.find(m => m.id === selectedMenuId) || draftMenus[0];

  const updateMenu = (updater) => {
    setDraftMenus(prev => prev.map(m => m.id === selectedMenuId ? updater(m) : m));
  };

  // Tree item updater
  const updateTreeItem = (items, itemId, patch) => {
    return items.map(item => {
      if (item.id === itemId) {
        return { ...item, ...patch };
      }
      if (item.children && item.children.length > 0) {
        return { ...item, children: updateTreeItem(item.children, itemId, patch) };
      }
      return item;
    });
  };

  // Tree item remover
  const removeTreeItem = (items, itemId) => {
    return items
      .filter(item => item.id !== itemId)
      .map(item => ({
        ...item,
        children: item.children ? removeTreeItem(item.children, itemId) : []
      }));
  };

  // Tree item mover
  const moveTreeItem = (items, itemId, direction) => {
    const index = items.findIndex(item => item.id === itemId);
    if (index >= 0) {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= items.length) return items;
      const clone = [...items];
      [clone[index], clone[targetIndex]] = [clone[targetIndex], clone[index]];
      return clone;
    }
    return items.map(item => ({
      ...item,
      children: item.children ? moveTreeItem(item.children, itemId, direction) : []
    }));
  };

  // Actions
  const handleUpdateItem = (itemId, key, value) => {
    updateMenu(m => ({ ...m, items: updateTreeItem(m.items, itemId, { [key]: value }) }));
  };

  const handleMoveItem = (itemId, direction) => {
    updateMenu(m => ({ ...m, items: moveTreeItem(m.items, itemId, direction) }));
  };

  const handleDeleteItem = (itemId) => {
    updateMenu(m => ({ ...m, items: removeTreeItem(m.items, itemId) }));
  };

  const handleAddTopItem = () => {
    const newItem = {
      id: `nav-${Date.now()}`,
      label: 'New Link',
      target: '/collections',
      type: 'PAGE',
      visible: true,
      children: []
    };
    updateMenu(m => ({ ...m, items: [...m.items, newItem] }));
  };

  const handleAddChildItem = (parentId) => {
    const newChild = {
      id: `child-${Date.now()}`,
      label: 'Sub Category',
      target: '/collections',
      type: 'PAGE',
      visible: true,
      children: []
    };
    const addChildRecursively = (items) => {
      return items.map(item => {
        if (item.id === parentId) {
          return { ...item, children: [...(item.children || []), newChild] };
        }
        if (item.children) {
          return { ...item, children: addChildRecursively(item.children) };
        }
        return item;
      });
    };
    updateMenu(m => ({ ...m, items: addChildRecursively(m.items) }));
  };

  const handleSave = () => {
    if (onSaveMenus) {
      onSaveMenus(draftMenus);
    }
    setSaveNotice('Navigation tree saved & published to storefront live!');
    setTimeout(() => setSaveNotice(''), 3000);
  };

  // Render individual item row in tree
  const renderItemRow = (item, depth = 0) => (
    <div key={item.id} className="space-y-2">
      <div 
        className={`bg-[#161616] border border-[#262626] rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          depth === 1 ? 'ml-6 sm:ml-8 border-l-2 border-l-[#ffaa00]/60' : depth >= 2 ? 'ml-12 sm:ml-16 border-l-2 border-l-[#ff3b30]' : ''
        }`}
      >
        {/* Left Inputs */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2.5 w-full">
          {/* Label Input */}
          <div className="sm:col-span-4">
            <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
              Link Label
            </span>
            <input 
              type="text" 
              value={item.label}
              onChange={(e) => handleUpdateItem(item.id, 'label', e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#333333] rounded px-3 py-1.5 text-xs text-white font-bold focus:border-white focus:outline-none"
              placeholder="e.g. DROPS"
            />
          </div>

          {/* Target URL */}
          <div className="sm:col-span-5">
            <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
              Destination URL
            </span>
            <input 
              type="text" 
              value={item.target}
              onChange={(e) => handleUpdateItem(item.id, 'target', e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#333333] rounded px-3 py-1.5 text-xs text-gray-300 font-mono focus:border-white focus:outline-none"
              placeholder="/collections or /access-pass"
            />
          </div>

          {/* Type Select */}
          <div className="sm:col-span-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
              Type
            </span>
            <select 
              value={item.type}
              onChange={(e) => handleUpdateItem(item.id, 'type', e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#333333] rounded px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none"
            >
              <option value="PAGE">Page</option>
              <option value="COLLECTION">Collection</option>
              <option value="EXTERNAL">External</option>
            </select>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          {/* Visibility Toggle */}
          <button
            onClick={() => handleUpdateItem(item.id, 'visible', !item.visible)}
            className={`px-2.5 py-1 rounded text-[10px] font-extrabold uppercase transition-colors ${
              item.visible !== false ? 'bg-[#1b2b1d] text-[#3ed660] border border-[#2e5236]' : 'bg-[#262626] text-gray-500'
            }`}
          >
            {item.visible !== false ? 'Visible' : 'Hidden'}
          </button>

          {/* Move Up / Down */}
          <button
            onClick={() => handleMoveItem(item.id, -1)}
            className="p-1.5 text-gray-400 hover:text-white bg-[#202020] hover:bg-[#2b2b2b] rounded transition-colors"
            title="Move Up"
          >
            <ChevronUp size={14} />
          </button>
          <button
            onClick={() => handleMoveItem(item.id, 1)}
            className="p-1.5 text-gray-400 hover:text-white bg-[#202020] hover:bg-[#2b2b2b] rounded transition-colors"
            title="Move Down"
          >
            <ChevronDown size={14} />
          </button>

          {/* Add Child (Max depth 2) */}
          {depth < 2 && (
            <button
              onClick={() => handleAddChildItem(item.id)}
              className="px-2 py-1 text-[11px] font-bold text-[#ffaa00] bg-[#221c0e] hover:bg-[#332a14] border border-[#ffaa00]/30 rounded transition-colors flex items-center gap-1"
              title="Add Sublink"
            >
              <Plus size={12} />
              <span>Sub</span>
            </button>
          )}

          {/* Delete */}
          <button
            onClick={() => handleDeleteItem(item.id)}
            className="p-1.5 text-gray-400 hover:text-[#ff3b30] hover:bg-[#251818] rounded transition-colors"
            title="Delete Link"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Render Nested Children */}
      {item.children && item.children.length > 0 && (
        <div className="space-y-2">
          {item.children.map(child => renderItemRow(child, depth + 1))}
        </div>
      )}
    </div>
  );

  return (
    <div className="admin-content animate-fade-in">
      
      {/* Intro Header */}
      <div className="admin-intro">
        <div>
          <div className="admin-intro-eyebrow">STOREFRONT NAVIGATION / ARCHITECTURE</div>
          <h1>MENU BUILDER</h1>
          <p className="admin-intro-desc">
            Organize multi-level drop navigation, assign menus to Header, Footer or Mobile Drawer, and reorder categories with live storefront sync.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={onViewStorefront}
            className="bg-[#181818] hover:bg-[#242424] text-white border border-[#333333] px-4 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Eye size={14} />
            <span>View Storefront</span>
          </button>

          <button 
            onClick={handleSave}
            className="btn-flame text-xs py-2.5 px-5 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-900/30"
          >
            <Save size={14} />
            <span>SAVE NAVIGATION</span>
          </button>
        </div>
      </div>

      {/* Save Notification Toast */}
      {saveNotice && (
        <div className="mb-6 p-3.5 bg-[#1b2b1d] border border-[#2e5236] rounded-lg text-[#3ed660] text-xs font-bold flex items-center gap-2 animate-fade-in">
          <Check size={16} />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Aside: Select Menu */}
        <div className="lg:col-span-4 bg-[#121212] border border-[#242424] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {draftMenus.length} Menus Configured
            </span>
          </div>

          <div className="space-y-2">
            {draftMenus.map((menu) => (
              <button
                key={menu.id}
                onClick={() => setSelectedMenuId(menu.id)}
                className={`w-full p-3.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                  selectedMenuId === menu.id
                    ? 'bg-[#221616] border-[#ff3b30] text-white shadow-md'
                    : 'bg-[#181818] border-[#282828] text-gray-300 hover:border-[#383838]'
                }`}
              >
                <div>
                  <div className="font-display text-sm font-bold tracking-wide uppercase">
                    {menu.name}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    Location: <span className="font-semibold text-white">{menu.location}</span> • {menu.items.length} top links
                  </div>
                </div>

                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#101010] text-[#3ed660] border border-[#222]">
                  {menu.status}
                </span>
              </button>
            ))}
          </div>

          {/* Quick Tip Box (Inspired by custom pod's Verified navigation note) */}
          <div className="p-3.5 bg-[#161616] border border-[#262626] rounded-lg text-xs space-y-1 text-gray-400">
            <div className="flex items-center gap-1.5 text-white font-bold text-[11px]">
              <Link2 size={13} className="text-[#ff3b30]" />
              <span>Dynamic Storefront Connection</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Modifying these navigation items updates the main Navbar, Mega-Menu dropdowns, and Footer links immediately on the customer storefront.
            </p>
          </div>
        </div>

        {/* Right Editor: Tree Items */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Menu Details & Action Bar */}
          <div className="bg-[#121212] border border-[#242424] rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#222222] mb-4">
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                  ACTIVE LOCATION: {currentMenu.location}
                </span>
                <h3 className="font-display text-xl font-black text-white uppercase tracking-tight">
                  {currentMenu.name}
                </h3>
              </div>

              <button
                onClick={handleAddTopItem}
                className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <Plus size={14} />
                <span>+ Add Top-Level Link</span>
              </button>
            </div>

            {/* Tree Items List */}
            <div className="space-y-3">
              {currentMenu.items.length > 0 ? (
                currentMenu.items.map(item => renderItemRow(item, 0))
              ) : (
                <div className="text-center py-12 bg-[#161616] rounded-lg border border-dashed border-[#2e2e2e]">
                  <p className="text-gray-400 text-xs font-semibold mb-3">No links in this menu yet.</p>
                  <button onClick={handleAddTopItem} className="btn-flame text-xs py-2 px-5">
                    Add First Link
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Live Storefront Preview Strip (Learned from custom pod's admin-menu-preview) */}
          <div className="bg-[#121212] border border-[#242424] rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Monitor size={14} className="text-[#3ed660]" />
                <span>LIVE STOREFRONT NAVBAR PREVIEW</span>
              </span>
              <span className="text-[10px] text-gray-500 uppercase">Simulated Header</span>
            </div>

            <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-3 flex items-center justify-between gap-4 overflow-x-auto">
              <div className="font-display font-black text-white text-base tracking-wider flex-shrink-0">
                LIDS<span className="text-[#e10600]">HD</span>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-gray-300">
                {currentMenu.items.filter(i => i.visible !== false).map(i => (
                  <span key={i.id} className="hover:text-white transition-colors cursor-default whitespace-nowrap">
                    {i.label}
                    {i.children && i.children.length > 0 && <span className="text-[9px] text-[#ffaa00] ml-1">▾</span>}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-white flex-shrink-0">
                <span className="bg-[#1e1e1e] px-2 py-0.5 rounded text-[10px] text-gray-400">⌘K Search</span>
                <span className="text-[#e10600]">BAG (1)</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
