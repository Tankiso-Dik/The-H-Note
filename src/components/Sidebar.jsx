import React, { useState, useEffect, useRef } from 'react';
import CreateButton from './CreateButton';
import ContextMenu from './ContextMenu';

const SidebarItem = ({ folder, isSelected, isRenaming, setRenamingId, onSelect, onRename, onDelete }) => {
  const [name, setName] = useState(folder.name);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleSubmit = () => {
    if (name.trim()) onRename(folder.id, name);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  // Context Menu state
  const [contextMenu, setContextMenu] = useState(null);

  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      <div
        className={`folder-row ${isSelected ? 'selected' : ''}`}
        onClick={() => onSelect(folder.id)}
        onContextMenu={handleContextMenu}
      >
        {isSelected && <div className="selection-pill" />}

        <span className="folder-icon">📁</span>

        {isRenaming ? (
          <input
            ref={inputRef}
            className="rename-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSubmit}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="folder-name">{folder.name}</span>
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          options={[
            { label: 'Rename', action: () => setRenamingId(folder.id) },
            { label: 'Delete', action: () => onDelete(folder.id) }
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
};

const Sidebar = ({
  folders,
  selectedFolderId,
  onSelectFolder,
  onAddFolder,
  renamingId,
  setRenamingId,
  onRename,
  onDelete,
  onExportData,
  onImportDataFile,
  onImportFromLocalStorage,
  dataStatus,
}) => {
  // Flat list: Only top-level folders (parentId === null)
  const rootFolders = folders.filter(f => f.parentId === null);
  const importInputRef = useRef(null);

  const triggerImport = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportDataFile(file);
    }
    event.target.value = '';
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        {/* Strict Requirement: "+ New" only creates top-level folder, no menu, immediate rename */}
        <CreateButton onCreate={() => onAddFolder('New Folder', null)} />
        <div className="data-actions">
          <button className="data-btn" onClick={onExportData} title="Export notes and folders">
            Export
          </button>
          <button className="data-btn" onClick={triggerImport} title="Import notes and folders">
            Import
          </button>
          <button className="data-btn" onClick={onImportFromLocalStorage} title="Import from old localStorage key">
            Migrate
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
        </div>
      </div>
      <div className="sidebar-content">
        {rootFolders.map(folder => (
          <SidebarItem
            key={folder.id}
            folder={folder}
            isSelected={selectedFolderId === folder.id}
            isRenaming={renamingId === folder.id}
            setRenamingId={setRenamingId}
            onSelect={onSelectFolder}
            onRename={onRename}
            onDelete={onDelete}
          />
        ))}
      </div>
      {dataStatus ? <div className="data-status">{dataStatus}</div> : null}

      <style>{`
        .sidebar {
          width: var(--sidebar-width);
          background-color: var(--bg-sidebar);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          height: 100%;
          flex-shrink: 0; 
        }

        .sidebar-header {
          padding: 16px; 
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 8px;
        }

        .data-actions {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
        }

        .data-btn {
          background: transparent;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 6px 8px;
          cursor: pointer;
          font-size: 12px;
          color: inherit;
        }

        .data-btn:hover {
          background-color: var(--hover-bg);
        }

        .theme-toggle-mini {
            background: transparent;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            cursor: pointer;
            padding: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            color: inherit;
        }

        .theme-toggle-mini:hover {
            background-color: var(--hover-bg);
        }

        .sidebar-content {
          flex: 1;
          overflow-y: auto;
          padding-top: 8px;
        }

        .data-status {
          min-height: 20px;
          padding: 6px 12px 10px;
          font-size: 12px;
          color: var(--editor-text-color);
          opacity: 0.7;
        }

        .folder-row {
          display: flex;
          align-items: center;
          height: 36px;
          cursor: pointer;
          position: relative;
          color: var(--editor-text-color);
          font-size: var(--font-size-body);
          border-radius: 4px;
          padding-left: 12px;
          margin: 2px 8px;
        }

        .folder-row:hover {
          background-color: var(--hover-bg);
        }

        .folder-row.selected {
          background-color: var(--selection-bg);
        }

        .selection-pill {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 16px;
          background-color: var(--color-accent);
          border-radius: 2px;
        }

        .folder-icon {
          margin-right: 12px;
          font-size: 16px;
          color: #DCB67A;
        }

        .folder-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .rename-input {
          flex: 1;
          font-family: inherit;
          font-size: inherit;
          border: 1px solid var(--color-accent);
          outline: none;
          padding: 2px 4px;
          border-radius: 2px;
          min-width: 0;
        }
      `}</style>
    </div>
  );
};

export default Sidebar;
