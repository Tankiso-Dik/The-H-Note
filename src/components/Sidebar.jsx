import React, { useEffect, useMemo, useRef, useState } from 'react';
import ContextMenu from './ContextMenu';
import CreateButton from './CreateButton';

const SidebarItem = ({
  folder,
  isSelected,
  isRenaming,
  isPendingCreation,
  isDragTarget,
  dropPosition,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  setRenamingId,
  onSelect,
  onRename,
  onCancelRename,
  onDelete,
}) => {
  const [name, setName] = useState(folder.name);
  const [contextMenu, setContextMenu] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setName(folder.name);
  }, [folder.name]);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleSubmit = () => {
    const trimmed = name.trim();

    if (!trimmed) {
      if (isPendingCreation) {
        onRename(folder.id, folder.name);
        return;
      }

      onCancelRename(folder.id);
      return;
    }

    if (trimmed === folder.name) {
      if (isPendingCreation) {
        onRename(folder.id, folder.name);
        return;
      }

      onCancelRename(folder.id);
      return;
    }

    onRename(folder.id, trimmed);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSubmit();
    }

    if (event.key === 'Escape') {
      onCancelRename(folder.id);
    }
  };

  const handleContextMenu = (event) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY });
  };

  return (
    <>
      <div
        className={`folder-row ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${
          isDragTarget ? `drop-${dropPosition}` : ''
        }`}
        onClick={() => onSelect(folder.id)}
        onContextMenu={handleContextMenu}
        draggable={!isRenaming && !isPendingCreation}
        onDragStart={(event) => onDragStart(event, folder.id)}
        onDragOver={(event) => onDragOver(event, folder.id)}
        onDrop={(event) => onDrop(event, folder.id)}
        onDragEnd={onDragEnd}
      >
        {isSelected ? <div className="selection-pill" /> : null}

        <span className="folder-icon">📁</span>

        {isRenaming ? (
          <input
            ref={inputRef}
            className="rename-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={handleSubmit}
            onKeyDown={handleKeyDown}
            onClick={(event) => event.stopPropagation()}
          />
        ) : (
          <span className="folder-name">{folder.name}</span>
        )}
      </div>

      {contextMenu ? (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          options={[
            { label: 'Rename', action: () => setRenamingId(folder.id) },
            { label: 'Delete', action: () => onDelete(folder.id) },
          ]}
          onClose={() => setContextMenu(null)}
        />
      ) : null}
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
  onReorderFolders,
  onExportData,
  onImportDataFile,
  onImportFromLocalStorage,
  dataStatus,
}) => {
  const rootFolders = folders.filter((folder) => folder.parentId === null);
  const [plusMenu, setPlusMenu] = useState(null);
  const [dragState, setDragState] = useState(null);
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

  const handleDragStart = (event, folderId) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', folderId);
    setDragState({
      draggedId: folderId,
      targetId: folderId,
      position: 'after',
    });
  };

  const handleDragOver = (event, folderId) => {
    event.preventDefault();

    if (!dragState?.draggedId || dragState.draggedId === folderId) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const nextPosition = event.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after';

    setDragState((prev) => {
      if (!prev || prev.draggedId === folderId && prev.position === nextPosition) {
        return prev;
      }

      if (prev.targetId === folderId && prev.position === nextPosition) {
        return prev;
      }

      return {
        ...prev,
        targetId: folderId,
        position: nextPosition,
      };
    });
  };

  const handleDrop = async (event, folderId) => {
    event.preventDefault();

    const draggedId = dragState?.draggedId ?? event.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === folderId) {
      setDragState(null);
      return;
    }

    const targetIndex = rootFolders.findIndex((folder) => folder.id === folderId);
    const draggedIndex = rootFolders.findIndex((folder) => folder.id === draggedId);

    if (targetIndex === -1 || draggedIndex === -1) {
      setDragState(null);
      return;
    }

    const nextFolders = [...rootFolders];
    const [draggedFolder] = nextFolders.splice(draggedIndex, 1);
    const rawInsertIndex = dragState?.position === 'before' ? targetIndex : targetIndex + 1;
    const insertIndex = draggedIndex < rawInsertIndex ? rawInsertIndex - 1 : rawInsertIndex;
    nextFolders.splice(insertIndex, 0, draggedFolder);

    setDragState(null);
    await onReorderFolders(nextFolders.map((folder) => folder.id), null);
  };

  const handleDragEnd = () => {
    setDragState(null);
  };

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
            isDragTarget={dragState?.targetId === folder.id && dragState.draggedId !== folder.id}
            dropPosition={dragState?.position ?? 'after'}
            isDragging={dragState?.draggedId === folder.id}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
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
          padding-right: 10px;
          margin: 2px 8px;
        }

        .folder-row:hover {
          background-color: var(--hover-bg);
        }

        .folder-row.selected {
          background-color: var(--selection-bg);
        }

        .folder-row.dragging {
          opacity: 0.5;
        }

        .folder-row.drop-before::before,
        .folder-row.drop-after::after {
          content: '';
          position: absolute;
          left: 10px;
          right: 10px;
          height: 2px;
          background-color: var(--color-accent);
          border-radius: 999px;
        }

        .folder-row.drop-before::before {
          top: -2px;
        }

        .folder-row.drop-after::after {
          bottom: -2px;
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
          min-width: 0;
          flex: 1;
        }

        .rename-input {
          flex: 1;
          min-width: 0;
          font-family: inherit;
          font-size: inherit;
          border: 1px solid var(--color-accent);
          outline: none;
          padding: 2px 4px;
          border-radius: 2px;
          color: var(--editor-text-color);
          background-color: var(--input-bg);
        }
      `}</style>
    </div>
  );
};

export default Sidebar;
