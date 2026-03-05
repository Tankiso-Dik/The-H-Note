import React from 'react';

const CreateButton = ({ onCreate }) => {
    return (
        <div className="create-button-container">
            <button
                className="create-btn"
                onClick={onCreate}
            >
                <span className="plus-icon">+</span>
                <span className="btn-text">New</span>
            </button>

            <style>{`
                .create-button-container {
                    position: relative;
                }

                .create-btn {
                    background-color: var(--input-bg);
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
                    color: var(--editor-text-color);
                }

                .create-btn:hover {
                    background-color: var(--hover-bg);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .plus-icon {
                    font-size: 16px;
                    font-weight: 300;
                    color: var(--color-accent);
                }
            `}</style>
        </div>
    );
};

export default CreateButton;
