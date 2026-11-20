import React, { useState } from 'react';

export interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  commands: CommandItem[];
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ commands, onClose }) => {
  const [query, setQuery] = useState('');

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="bp-cmd-backdrop" onClick={onClose}>
      <div className="bp-cmd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="bp-cmd-header">
          <span className="bp-prop-label">COMMAND PALETTE // KOMUT PALETİ</span>
          <span className="bp-kbd">ESC</span>
        </div>
        <input
          autoFocus
          className="bp-cmd-input"
          placeholder="Araç, katman veya komut ara..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter' && filtered.length > 0) {
              filtered[0].action();
              onClose();
            }
          }}
        />
        <div className="bp-cmd-list">
          {filtered.map((cmd) => (
            <button
              key={cmd.id}
              className="bp-cmd-item"
              onClick={() => {
                cmd.action();
                onClose();
              }}
            >
              <span>{cmd.label}</span>
              {cmd.shortcut && <span className="bp-kbd">{cmd.shortcut}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
