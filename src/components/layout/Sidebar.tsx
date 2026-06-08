/**
 * Sidebar Component
 * Left sidebar with model controls
 */

import { FileUploader } from '../configurator/FileUploader';

export function Sidebar() {
  return (
    <div className="w-80 bg-card border-r border-border overflow-y-auto p-6 flex items-center justify-center min-h-full">
      <div className="space-y-6">
        <FileUploader />
      </div>
    </div>
  );
}
