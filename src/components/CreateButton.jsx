import React, { useState } from 'react';

const CreateButton = ({ onCreate }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleCreate = () => {
        onCreate();
        setIsOpen(false);
    };

    return (
        <div className="create-button-container" onMouseLeave={() => setIsOpen(false)}>
            {/* 
              Per requirements: 
              "The '+ New' button... is ONLY for creating top-level folders"
              Since it's a single action context here, we can simplify interactions.
              However, keeping it as a menu preserves the "visual" aspect requested originally if expanded later.
              For now, we'll keep the dropdown but with the restricted option.
            */}
            <button
                className={`create-btn ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="plus-icon">+</span>
                <span className="btn-text">New</span>
            </button>

            {isOpen && (
                <div className="create-menu">
                    <div
                        className="menu-item"
                        onClick={handleCreate}
                    >
                        New Folder
                    </div>
                </div>
            )}

            <style>{`
                .create-button-container {
                    position: relative;
                }

                .create-btn {
                    background-color: #FFFFFF;
                    border: 1px solid var(--border-color);
                    border-radius: 4px;
                    padding: 8px 16px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05); /* Subtle lift */
                    font-family: var(--font-family);
                    font-size: var(--font-size-body);
                    transition: background-color 0.1s, box-shadow 0.1s;
                }

                .create-btn:hover {
                    background-color: #FBFBFB;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .create-btn.active {
                    background-color: #F5F5F5;
                }

                .plus-icon {
                    font-size: 16px;
                    font-weight: 300;
                    color: var(--color-accent);
                }

                .create-menu {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    margin-top: 4px;
                    width: 200px;
                    background: #FFFFFF;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    box-shadow: 0 8px 16px rgba(0,0,0,0.14);
                    padding: 4px 0;
                    z-index: 100;
                    animation: fadeIn 0.1s ease-out;
                }

                .menu-item {
                    padding: 8px 12px;
                    font-size: var(--font-size-body);
                    cursor: pointer;
                    color: #202020;
                    display: flex;
                    align-items: center;
                }

                .menu-item:hover {
                    background-color: var(--hover-bg);
                }
                
                .menu-item.disabled {
                    color: #999;
                    cursor: default;
                }
                 
                .menu-item.disabled:hover {
                    background-color: transparent;
                }

                .menu-separator {
                    height: 1px;
                    background-color: var(--border-color);
                    margin: 4px 0;
                }
                
                .menu-section-label {
                    padding: 4px 12px;
                    font-size: 11px;
                    color: #707070;
                    font-weight: 600;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default CreateButton;
