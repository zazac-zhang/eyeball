import { create } from 'zustand';

/** Default keyboard shortcuts */
export const DEFAULT_KEYBINDINGS: KeyBindings = {
  modeView: 'v',
  modePlace: 'p',
  modeEdit: 'e',
  modeReplay: 'r',
  insertUp: 'ArrowUp',
  withdrawDown: 'ArrowDown',
  rotateLeft: 'ArrowLeft',
  rotateRight: 'ArrowRight',
  preset1: '1',
  preset2: '2',
  preset3: '3',
  preset4: '4',
  reset: 'Escape',
  clearTrails: 'c',
  undo: 'z',
  redo: 'y',
};

export interface KeyBindings {
  modeView: string;
  modePlace: string;
  modeEdit: string;
  modeReplay: string;
  insertUp: string;
  withdrawDown: string;
  rotateLeft: string;
  rotateRight: string;
  preset1: string;
  preset2: string;
  preset3: string;
  preset4: string;
  reset: string;
  clearTrails: string;
  undo: string;
  redo: string;
}

export interface KeyBindingsState {
  keyBindings: KeyBindings;
  setKeyBinding: (key: keyof KeyBindings, value: string) => void;
  resetKeyBindings: () => void;
}

const STORAGE_KEY = 'eyeball-keybindings';

function loadKeyBindings(): KeyBindings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_KEYBINDINGS, ...JSON.parse(saved) };
    }
  } catch {
    // Ignore
  }
  return { ...DEFAULT_KEYBINDINGS };
}

function saveKeyBindings(keyBindings: KeyBindings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keyBindings));
  } catch {
    // Ignore
  }
}

export const useKeyBindingsStore = create<KeyBindingsState>((set) => ({
  keyBindings: loadKeyBindings(),

  setKeyBinding: (key, value) => {
    set((state) => {
      const newBindings = { ...state.keyBindings, [key]: value };
      saveKeyBindings(newBindings);
      return { keyBindings: newBindings };
    });
  },

  resetKeyBindings: () => {
    set({ keyBindings: { ...DEFAULT_KEYBINDINGS } });
    localStorage.removeItem(STORAGE_KEY);
  },
}));
