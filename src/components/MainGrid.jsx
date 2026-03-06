import React, { useState, useEffect } from 'react';
import Card from './Card';
import ContextMenu from './ContextMenu';

const isTypingTarget = (target) => {
    if (!target) {
        return false;
    }

    const tagName = target.tagName?.toLowerCase();
    return tagName === 'input'
        || tagName === 'textarea'
        || tagName === 'select'
        || Boolean(target.isContentEditable);
};

const MainGrid = ({ currentFolder, allFolders, subFolders, notes, allNotes, onAddFolder, onAddNote, onNavigate, onOpenNote, renamingId, setRenamingId, onRename, onDelete, onToggleTemplate, theme, onToggleTheme }) => {
    const [selection, setSelection] = useState([]);

    // Breadcrumb Logic
    const getBreadcrumbs = () => {
        const path = [];
        let curr = currentFolder;
        while (curr) {
            path.unshift(curr);
            curr = allFolders.find(f => f.id === curr.parentId);
        }
        return path;
    };
    const breadcrumbs = getBreadcrumbs();

    // Grid Create Tile State
    const [createMenuOpen, setCreateMenuOpen] = useState(false);
    const [createMenuAnchor, setCreateMenuAnchor] = useState(null);

    const handleCreateClick = (e) => {
        setCreateMenuOpen(true);
        setCreateMenuAnchor({ x: e.clientX, y: e.clientY });
    };

    const handleCreateAction = (type, template = null) => {
        if (type === 'folder') onAddFolder('New Folder');
        if (type === 'note') {
            if (template) {
                // Pass template content to the new note
                let newTitle = template.title;
                let counter = 1;
                while (notes.some(n => n.title === newTitle)) {
                    newTitle = `${template.title}-${counter}`;
                    counter++;
                }

                onAddNote(newTitle, false, template.content);
            } else {
                onAddNote('New Note', false);
            }
        }
        setCreateMenuOpen(false);
        setCreateMenuAnchor(null);
    };

    const handleCardClick = (id, multiSelect) => {
        if (multiSelect) {
            if (selection.includes(id)) {
                setSelection(selection.filter(item => item !== id));
            } else {
                setSelection([...selection, id]);
            }
        } else {
            setSelection([id]);
        }

        // If it's a note, open it on click
        const note = notes.find(n => n.id === id);
        if (note && !multiSelect) {
            onOpenNote(id);
        }
    };

    // Clear selection when folder changes
    useEffect(() => {
        setSelection([]);
    }, [currentFolder]);

    const isEmpty = subFolders.length === 0 && notes.length === 0;

    const [contextMenu, setContextMenu] = useState(null);

    const handleContextMenu = (e, type, id) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            targetId: id,
            type: type
        });
    };

    const closeContextMenu = () => setContextMenu(null);

    // Context Menu Options
    const getMenuOptions = () => {
        if (!contextMenu) return [];

        const { targetId, type } = contextMenu;

        const options = [];

        if (type === 'note') {
            options.push({ label: 'Open', action: () => onOpenNote(targetId) });
            options.push({ separator: true });
        }

        // Common Options
        options.push({ label: 'Rename', action: () => setRenamingId(targetId) });
        options.push({ label: 'Delete', action: () => onDelete(targetId) });

        if (type === 'note') {
            options.push({ separator: true });
            options.push({ label: 'Convert to Template', action: () => onToggleTemplate(targetId) });
        }

        return options;
    };

    // Template filtering for "Create" menu
    // Global templates - accessible from any folder
    const globalTemplates = allNotes.filter(n => n.isTemplate);
    const selectedItems = selection
        .map((id) => {
            const folder = subFolders.find((item) => item.id === id);
            if (folder) {
                return { id, type: 'folder' };
            }

            const note = notes.find((item) => item.id === id);
            if (note) {
                return { id, type: 'note' };
            }

            return null;
        })
        .filter(Boolean);
    const primarySelection = selectedItems[0] ?? null;

    const openSelection = () => {
        if (!primarySelection || selectedItems.length !== 1) {
            return;
        }

        if (primarySelection.type === 'folder') {
            onNavigate(primarySelection.id);
            return;
        }

        onOpenNote(primarySelection.id);
    };

    const renameSelection = () => {
        if (!primarySelection || selectedItems.length !== 1) {
            return;
        }

        setRenamingId(primarySelection.id);
    };

    const deleteSelection = () => {
        if (selectedItems.length === 0) {
            return;
        }

        selectedItems.forEach((item) => onDelete(item.id));
        setSelection([]);
    };

    const handleGridKeyDown = (event) => {
        if (isTypingTarget(event.target) || renamingId) {
            return;
        }

        if (event.key === 'Delete' || event.key === 'Backspace') {
            if (selectedItems.length === 0) {
                return;
            }

            event.preventDefault();
            deleteSelection();
            return;
        }

        if (event.key === 'Enter') {
            if (selectedItems.length !== 1) {
                return;
            }

            event.preventDefault();
            openSelection();
            return;
        }

        if (event.key === 'F2') {
            if (selectedItems.length !== 1) {
                return;
            }

            event.preventDefault();
            renameSelection();
        }
    };

    return (
        <div className="main-content">
            <div className="address-bar">
                <div className="breadcrumb">
                    <span
                        className={`crumb ${!currentFolder ? 'active' : ''}`}
                        onClick={() => onNavigate(null)}
                    >
                    </span>

                    {breadcrumbs.map((folder, index) => (
                        <React.Fragment key={folder.id}>
                            <span
                                className={`crumb ${index === breadcrumbs.length - 1 ? 'active' : ''}`}
                                onClick={() => onNavigate(folder.id)}
                            >
                                {folder.name}
                            </span>
                            {index < breadcrumbs.length - 1 && <span className="separator">›</span>}
                        </React.Fragment>
                    ))}

                    {breadcrumbs.length === 0 && <span className="crumb active">Home</span>}
                </div>

                <div className="main-options">
                    <button
                        className="theme-toggle-grid"
                        onClick={onToggleTheme}
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                </div>
            </div>

            <div
                className="grid-scroller"
                onClick={() => setSelection([])}
                onKeyDown={handleGridKeyDown}
                tabIndex={0}
            >
                <div className="grid-container">
                    {subFolders.map(folder => (
                        <Card
                            key={folder.id}
                            type="folder"
                            title={folder.name}
                            isSelected={selection.includes(folder.id)}
                            isRenaming={renamingId === folder.id}
                            onRename={(newName) => onRename(folder.id, newName)}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (e.ctrlKey || e.metaKey) {
                                    handleCardClick(folder.id, true);
                                } else {
                                    onNavigate(folder.id);
                                }
                            }}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleContextMenu(e, 'folder', folder.id);
                            }}
                        />
                    ))}
                    {notes.map(note => (
                        <Card
                            key={note.id}
                            type="note"
                            title={note.title}
                            isTemplate={note.isTemplate}
                            isSelected={selection.includes(note.id)}
                            isRenaming={renamingId === note.id}
                            onRename={(newName) => onRename(note.id, newName)}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCardClick(note.id, e.ctrlKey || e.metaKey);
                            }}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleContextMenu(e, 'note', note.id);
                            }}
                        />
                    ))}

                    {/* Grid Creation Tile */}
                    <div className="card create-tile" onClick={handleCreateClick}>
                        <div className="create-icon">+</div>
                        <div className="card-label">New</div>
                    </div>
                </div>
            </div>

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    options={getMenuOptions()}
                    onClose={closeContextMenu}
                />
            )}

            {/* Creation Menu Popover */}
            {createMenuOpen && (
                <ContextMenu
                    x={createMenuAnchor.x}
                    y={createMenuAnchor.y}
                    options={[
                        { label: 'New Folder', action: () => handleCreateAction('folder') },
                        { label: 'New Note', action: () => handleCreateAction('note') },
                        ...(globalTemplates.length > 0 ? [
                            { separator: true },
                            ...globalTemplates.map(t => ({
                                label: t.title,
                                action: () => handleCreateAction('note', t)
                            }))
                        ] : [])
                    ]}
                    onClose={() => setCreateMenuOpen(false)}
                />
            )}

            <style>{`
                .main-content {
                    flex: 1;
                    background-color: var(--bg-main);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .address-bar {
                    height: 48px;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 24px;
                }

                .theme-toggle-grid {
                    background: transparent;
                    border: 1px solid var(--border-color);
                    border-radius: 4px;
                    cursor: pointer;
                    padding: 6px 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    color: inherit;
                }

                .theme-toggle-grid:hover {
                    background-color: var(--hover-bg);
                }
                
                .breadcrumb {
                   display: flex;
                   align-items: center;
                   gap: 8px;
                   font-size: 14px;
                   color: var(--editor-text-color);
                   opacity: 0.7;
                }

                .crumb {
                    cursor: pointer;
                    padding: 2px 4px;
                    border-radius: 4px;
                }

                .crumb:hover {
                    background-color: var(--hover-bg);
                }

                .crumb.active {
                    font-weight: 600;
                    color: var(--editor-text-color);
                    opacity: 1;
                    cursor: default;
                }
                
                .crumb.active:hover {
                    background-color: transparent;
                }
                
                .separator {
                    color: var(--editor-text-color);
                    opacity: 0.5;
                    font-size: 12px;
                }

                .grid-scroller {
                    flex: 1;
                    overflow-y: auto;
                    padding: 24px;
                }

                .grid-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 24px;
                    align-content: flex-start;
                }

                .create-tile {
                    border: 1px dashed var(--border-color);
                    background-color: rgba(0,0,0,0.02);
                    color: var(--editor-text-color);
                    width: 120px;
                    height: 140px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-start;
                    padding: 8px;
                    border-radius: var(--radius-button);
                    cursor: pointer;
                    opacity: 0.7;
                }
                
                .create-tile:hover {
                    border-color: var(--color-accent);
                    background-color: var(--selection-bg);
                    color: var(--color-accent);
                    opacity: 1;
                }

                .create-icon {
                    font-size: 32px;
                    font-weight: 300;
                    margin-bottom: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex: 1;
                    width: 100%;
                }
            `}</style>
        </div>
    );
};

export default MainGrid;
