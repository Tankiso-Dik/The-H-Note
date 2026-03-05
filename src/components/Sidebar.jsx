import React, { useEffect, useMemo, useRef, useState } from 'react';
import ContextMenu from './ContextMenu';
import CreateButton from './CreateButton';

const SidebarItem = ({
  folder,
  isSelected,
  isRenaming,
  isPendingCreation,
  setRenamingId,
  onSelect,
  onRename,
  onCancelRename,
  onDelete,
}) => {
  const [name, setName] = useState(folder.name);
  const inputRef = useRef(null);
  const cancelReadyRef = useRef(!isPendingCreation);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  useEffect(() => {
    if (!isPendingCreation || !isRenaming) {
      cancelReadyRef.current = true;
      return;
    }

    cancelReadyRef.current = false;
    const timerId = window.setTimeout(() => {
      cancelReadyRef.current = true;
    }, 350);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [isPendingCreation, isRenaming]);

  const handleSubmit = () => {
    if (isPendingCreation && !cancelReadyRef.current) {
      return;
    }

    const trimmed = name.trim();
    if (!trimmed) {
      onCancelRename(folder.id);
      return;
    }

    if (trimmed === folder.name) {
      onCancelRename(folder.id);
      return;
    }

    onRename(folder.id, trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

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
            { label: 'Delete', action: () => onDelete(folder.id) },
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
  onCancelRename,
  pendingFolderCreations,
  onDelete,
  onExportData,
  onImportDataFile,
  onImportFromLocalStorage,
  dataStatus,
}) => {
  const rootFolders = folders.filter((folder) => folder.parentId === null);

  const [plusMenu, setPlusMenu] = useState(null);
  const plusAreaRef = useRef(null);
  const importInputRef = useRef(null);

  const openPlusMenu = (event) => {
    event.stopPropagation();
    setPlusMenu((prev) => (prev ? null : { open: true }));
  };

  const handleImportFile = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportDataFile(file);
    }
    event.target.value = '';
  };

  const plusOptions = useMemo(
    () => [
      { label: 'Export', action: onExportData },
      { label: 'Import', action: () => importInputRef.current?.click() },
      { label: 'Migrate', action: onImportFromLocalStorage },
    ],
    [onExportData, onImportFromLocalStorage]
  );

  useEffect(() => {
    if (!plusMenu) {
      return;
    }

    const handleOutsideClick = (event) => {
      if (plusAreaRef.current && !plusAreaRef.current.contains(event.target)) {
        setPlusMenu(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setPlusMenu(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [plusMenu]);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <CreateButton onCreate={() => onAddFolder('New Folder', null)} />
      </div>

      <div className="sidebar-content">
        {rootFolders.map((folder) => (
          <SidebarItem
            key={folder.id}
            folder={folder}
            isSelected={selectedFolderId === folder.id}
            isRenaming={renamingId === folder.id}
            isPendingCreation={Boolean(pendingFolderCreations?.[folder.id])}
            setRenamingId={setRenamingId}
            onSelect={onSelectFolder}
            onRename={onRename}
            onCancelRename={onCancelRename}
            onDelete={onDelete}
          />
        ))}
      </div>

      <div className="sidebar-footer" ref={plusAreaRef}>
        {dataStatus ? <div className="data-status">{dataStatus}</div> : null}
        <button
          className="sidebar-plus-btn"
          title="Create and data options"
          onClick={openPlusMenu}
        >
          +
        </button>

        {plusMenu ? (
          <div className="sidebar-plus-menu" onClick={(event) => event.stopPropagation()}>
            {plusOptions.map((option) => (
              <button
                key={option.label}
                className="sidebar-plus-menu-item"
                onClick={() => {
                  option.action();
                  setPlusMenu(null);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <input
        ref={importInputRef}
        type="file"
        accept="application/json"
        style={{ display: 'none' }}
        onChange={handleImportFile}
      />

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
          padding: 12px 10px 6px;
          border-bottom: 1px solid var(--border-color);
        }

        .sidebar-content {
          flex: 1;
          overflow-y: auto;
          padding-top: 8px;
        }

        .sidebar-footer {
          position: relative;
          padding: 10px;
          border-top: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }

        .data-status {
          min-height: 16px;
          font-size: 12px;
          color: var(--editor-text-color);
          opacity: 0.8;
          line-height: 1.4;
          word-break: break-word;
        }

        .sidebar-plus-btn {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          border: 1px solid var(--border-color);
          background-color: var(--input-bg);
          color: var(--editor-text-color);
          font-size: 22px;
          line-height: 1;
          cursor: pointer;
        }

        .sidebar-plus-btn:hover {
          background-color: var(--hover-bg);
        }

        .sidebar-plus-menu {
          position: absolute;
          left: 10px;
          bottom: 50px;
          width: 170px;
          background: var(--input-bg);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          box-shadow: 0 8px 16px rgba(0,0,0,0.14);
          z-index: 2000;
          overflow: hidden;
        }

        .sidebar-plus-menu-item {
          width: 100%;
          text-align: left;
          background: transparent;
          border: 0;
          color: var(--editor-text-color);
          font-size: var(--font-size-body);
          padding: 9px 12px;
          cursor: pointer;
        }

        .sidebar-plus-menu-item:hover {
          background: var(--hover-bg);
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
          color: var(--editor-text-color);
          background-color: var(--input-bg);
        }
      `}</style>
    </div>
  );
};

export default Sidebar;
