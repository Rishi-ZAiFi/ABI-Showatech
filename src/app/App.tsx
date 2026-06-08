/**
 * App Component
 * Main application layout and state management
 */

import { useConfiguratorStore } from '../store/configurator.store';
import { AppThemeProvider } from '../components/theme/ThemeProvider';
import { TopBar } from '../components/layout/TopBar';
import { Viewport } from '../components/layout/Viewport';
import { Inspector } from '../components/layout/Inspector';
import { FileUploader } from '../components/configurator/FileUploader';
import { useTheme } from 'next-themes';

function AppContent() {
  const store = useConfiguratorStore();
  const { theme } = useTheme();
  const hasModel = store.modelUrl !== null;

  return (
    <div className="flex flex-col h-screen p-3 space-y-3" style={{ backgroundColor: theme === 'dark' ? '#252525' : '#ffffff' }}>
      {/* Top Bar - Always visible */}
      <TopBar />

      {/* Main Content */}
      {hasModel ? (
        // Loaded State: Viewport and Inspector layout
        <div className="flex flex-1 overflow-hidden gap-3">
          {/* Viewport */}
          <Viewport />

          {/* Right Inspector */}
          <Inspector />
        </div>
      ) : (
        // Empty State: Centered upload area
        <div className="flex-1 flex items-center justify-center p-8">
          <FileUploader />
        </div>
      )}
    </div>
  );
}

export function App() {
  return (
    <AppThemeProvider>
      <AppContent />
    </AppThemeProvider>
  );
}
