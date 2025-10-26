// This file is used to declare global types.
// By augmenting the Window interface, we can access window.aistudio
// without TypeScript errors.

// FIX: Define a named interface 'AIStudio' to resolve declaration conflicts.
// The error message indicates that another declaration expects 'aistudio' to be of type 'AIStudio'.
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    aistudio: AIStudio;
  }
}

// The 'export {}' is necessary to make this file a module,
// which is required for global declarations to be applied correctly.
export {};