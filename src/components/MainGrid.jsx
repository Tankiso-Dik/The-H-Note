import React, { useState, useEffect } from 'react';
import Card from './Card';
import ContextMenu from './ContextMenu';

const MainGrid = ({ currentFolder, allFolders, subFolders, notes, onAddFolder, onAddNote, onNavigate, renamingId, setRenamingId, onRename, onDelete, onToggleTemplate }) => {
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
                // Should copy content, but for UI mock we just creating a new note with template logic
                // In a real app we'd copy `template.content`.
                // Requirement: "Create Note -> Templates"
                onAddNote(`Copy of ${template.title}`, false);
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
            options.push({ label: 'Open', action: () => console.log("Open Note UI") });
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
    // "Templates (only templates from the current folder)"
    // The current folders templates are notes inside `subFolders`? NO.
    // Templates are notes in the CURRENT folder. So just filter `notes` (which are already filtered by App.jsx to be in current folder).
    const localTemplates = notes.filter(n => n.isTemplate);

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
            </div>

            <div className="grid-scroller" onClick={() => setSelection([])}>
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
                            onContextMenu={(e) => handleCardClick(folder.id, false) || handleContextMenu(e, 'folder', folder.id)}
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
                            onContextMenu={(e) => handleCardClick(note.id, false) || handleContextMenu(e, 'note', note.id)}
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
                        ...(localTemplates.length > 0 ? [
                            { separator: true },
                            { label: 'Templates (Current Folder)', disabled: true },
                            ...localTemplates.map(t => ({
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
                    padding: 0 24px;
                }
                
                .breadcrumb {
                   display: flex;
                   align-items: center;
                   gap: 8px;
                   font-size: 14px;
                   color: #606060;
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
                    color: #000;
                    cursor: default;
                }
                
                .crumb.active:hover {
                    background-color: transparent;
                }
                
                .separator {
                    color: #A0A0A0;
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
                    border: 1px dashed #C0C0C0;
                    background-color: #FAFAFA;
                    color: #606060;
                    width: 120px;
                    height: 140px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-start;
                    padding: 8px;
                    border-radius: var(--radius-button);
                    cursor: pointer;
                }
                
                .create-tile:hover {
                    border-color: var(--color-accent);
                    background-color: var(--selection-bg);
                    color: var(--color-accent);
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
