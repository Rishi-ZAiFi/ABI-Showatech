/**
 * App Component
 * Main application layout and state management
 */

import { useConfiguratorStore } from '../store/configurator.store';
import { useWorkflowStore } from '../store/workflow.store';
import { AppThemeProvider } from '../components/theme/ThemeProvider';
import { TopBar } from '../components/layout/TopBar';
import { Viewport } from '../components/layout/Viewport';
import { Inspector } from '../components/layout/Inspector';
import { FileUploader } from '../components/configurator/FileUploader';
import { ToastContainer } from '../components/ui/toast';
import { PresenterOverlay } from '../components/workflow/PresenterOverlay';
import { useTheme } from 'next-themes';

function AppContent() {
  const store = useConfiguratorStore();
  const isPresentMode = useWorkflowStore((s) => s.isPresentMode);
  const { theme } = useTheme();
  const hasModel = store.modelUrl !== null;

  // Presenter mode: fullscreen 3D view + floating overlay
  if (isPresentMode) {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-black">
        <Viewport />
        <PresenterOverlay />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen p-3 space-y-3" style={{ backgroundColor: theme === 'dark' ? '#252525' : '#ffffff' }}>
      <TopBar />

      {hasModel ? (
        <div className="flex flex-1 overflow-hidden gap-3">
          <Viewport />
          <Inspector />
        </div>
      ) : (
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
      <ToastContainer />
    </AppThemeProvider>
  );
}
