/**
 * File Uploader Component
 * Handles drag-drop and file selection with support for GLTF file dependencies
 */

import { useState, useRef } from 'react';
import { useConfiguratorStore } from '../../store/configurator.store';
import { LoaderService } from '../../services/loader.service';
import { FileService } from '../../services/file.service';
import { Cloud, Upload, AlertCircle, FolderOpen } from 'lucide-react';

interface FileWithPath extends File {
  relativePath?: string;
  fullPath?: string;
}
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

export function FileUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const [gltfFile, setGltfFile] = useState<FileWithPath | null>(null);
  const [binFile, setBinFile] = useState<FileWithPath | null>(null);
  const [textureFiles, setTextureFiles] = useState<FileWithPath[]>([]);
  const [step, setStep] = useState<'idle' | 'waiting-bin' | 'waiting-textures'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const binInputRef = useRef<HTMLInputElement>(null);
  const textureInputRef = useRef<HTMLInputElement>(null);
  const store = useConfiguratorStore();

  const getDisplayPath = (file: FileWithPath): string => {
    return file.relativePath || file.fullPath || file.name;
  };

  const handleFile = async (file: FileWithPath, additionalFiles?: FileWithPath[]) => {
    if (!FileService.isSupportedFormat(file)) {
      alert('Unsupported file format. Please open a .glb, .gltf, .fbx, or .obj');
      return;
    }

    // If it's a GLTF file, start the multi-step workflow
    if (file.name.endsWith('.gltf')) {
      setGltfFile(file);
      setBinFile(null);
      setTextureFiles([]);
      setStep('waiting-bin');
      return;
    }

    // For other formats (GLB, FBX, OBJ), load directly
    try {
      store.setIsLoading(true);
      const url = await LoaderService.loadModelFromFile(file, additionalFiles);
      store.setModelUrl(url, file.name.split('.')[0]);
    } catch (error) {
      console.error('Failed to load model:', error);
      alert('Failed to load model. See console for details.');
      store.setIsLoading(false);
    }
  };

  const handleBinFileSelected = (file: FileWithPath) => {
    if (file.name.endsWith('.bin')) {
      setBinFile(file);
      setStep('waiting-textures');
    } else {
      alert('Please select a .bin file');
    }
  };

  const handleTexturesSelected = (files: FileWithPath[]) => {
    setTextureFiles(files);
  };

  const handleLoadGltfModel = async () => {
    if (!gltfFile || !binFile) return;

    try {
      store.setIsLoading(true);
      const relatedFiles = [binFile, ...textureFiles];
      const url = await LoaderService.loadModelFromFile(gltfFile, relatedFiles);
      store.setModelUrl(url, gltfFile.name.split('.')[0]);
      
      // Reset state
      setGltfFile(null);
      setBinFile(null);
      setTextureFiles([]);
      setStep('idle');
    } catch (error) {
      console.error('Failed to load model:', error);
      alert('Failed to load model. See console for details.');
      store.setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setGltfFile(null);
    setBinFile(null);
    setTextureFiles([]);
    setStep('idle');
  };


  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    const files: FileWithPath[] = [];

    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
          const file = items[i].getAsFile();
          if (file) {
            const entry = items[i].webkitGetAsEntry() as any;
            (file as any).relativePath = entry?.fullPath || file.name;
            files.push(file as FileWithPath);
          }
        }
      }
    } else {
      for (const file of e.dataTransfer.files) {
        (file as any).relativePath = file.name;
        files.push(file as FileWithPath);
      }
    }

    if (files.length > 0) {
      const modelFile = files.find(
        (f) =>
          f.name.endsWith('.glb') ||
          f.name.endsWith('.gltf') ||
          f.name.endsWith('.fbx') ||
          f.name.endsWith('.obj')
      );

      if (modelFile) {
        const additionalFiles = files.filter((f) => f !== modelFile);
        handleFile(modelFile, additionalFiles);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      const file = files[0];
      (file as any).relativePath = (file as any).webkitRelativePath || file.name;
      handleFile(file as FileWithPath);
    }
  };

  return (
    <>
      <div className="flex justify-center">
        <div
          className={`flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed transition max-w-sm w-full ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border bg-muted/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Cloud className="w-12 h-12 text-muted-foreground mb-4" />

          <h3 className="text-lg font-semibold text-foreground mb-2">
            Open 3D Model
          </h3>

          <p className="text-sm text-muted-foreground text-center mb-6">
            Drag and drop your model file here, or click to browse.
            <br />
            <span className="text-xs">Supports .glb, .gltf, .fbx, .obj</span>
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".glb,.gltf,.fbx,.obj"
            onChange={handleInputChange}
            className="hidden"
          />

          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="default"
            className="gap-2"
            disabled={store.isLoading}
          >
            <Upload className="w-4 h-4" />
            {store.isLoading ? 'Processing...' : 'Choose File'}
          </Button>
        </div>
      </div>

      {/* Step 1: Upload BIN File */}
      <Dialog open={step === 'waiting-bin'} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              Step 1: Select Buffer File (.bin)
            </DialogTitle>
            <DialogDescription>
              Select the .bin buffer file that contains the model geometry data
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                GLTF file selected: <span className="font-semibold">{gltfFile?.name}</span>
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-200 mt-2">
                Now select the corresponding .bin buffer file that the GLTF references.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Select .bin File
              </label>
              <input
                ref={binInputRef}
                type="file"
                accept=".bin"
                onChange={(e) => {
                  const files = e.currentTarget.files;
                  if (files && files.length > 0) {
                    const file = files[0];
                    (file as any).relativePath = file.name;
                    handleBinFileSelected(file as FileWithPath);
                  }
                }}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-muted file:text-foreground hover:file:bg-muted/80"
              />
            </div>

            {binFile && (
              <div className="p-2 rounded bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50">
                <p className="text-xs text-green-900 dark:text-green-100 font-mono">
                  ✓ Selected: {binFile.name}
                </p>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4">
              <Button onClick={handleCancel} variant="outline">
                Cancel
              </Button>
              <Button onClick={() => binFile && setStep('waiting-textures')} disabled={!binFile}>
                Next: Select Textures
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Step 2: Upload Texture Files */}
      <Dialog open={step === 'waiting-textures'} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-purple-600" />
              Step 2: Select Texture Files (Optional)
            </DialogTitle>
            <DialogDescription>
              Select any texture images (.png, .jpg, .webp) that the model uses. Skip if there are no textures.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50">
              <p className="text-sm text-purple-900 dark:text-purple-100">
                Files prepared: <span className="font-semibold">{gltfFile?.name}</span> + <span className="font-semibold">{binFile?.name}</span>
              </p>
              <p className="text-xs text-purple-800 dark:text-purple-200 mt-2">
                Now select any texture files (.png, .jpg, .webp, etc.) that the model uses. You can skip this if there are no textures.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Select Texture Files (Optional)
              </label>
              <input
                ref={textureInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const files = e.currentTarget.files;
                  if (files) {
                    const filesArray: FileWithPath[] = Array.from(files).map((file: any) => {
                      file.relativePath = file.webkitRelativePath || file.name;
                      return file as FileWithPath;
                    });
                    handleTexturesSelected(filesArray);
                  }
                }}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-muted file:text-foreground hover:file:bg-muted/80"
              />
              <p className="text-xs text-muted-foreground mt-2">
                💡 You can select multiple textures or an entire folder.
              </p>
            </div>

            {textureFiles.length > 0 && (
              <div className="p-3 rounded bg-muted border border-border max-h-48 overflow-y-auto">
                <p className="font-medium text-foreground mb-2 text-sm">
                  {textureFiles.length} texture{textureFiles.length !== 1 ? 's' : ''} selected:
                </p>
                <div className="space-y-1 text-xs text-muted-foreground font-mono">
                  {textureFiles.map((file) => (
                    <div key={getDisplayPath(file)} className="truncate pl-4 before:content-['🖼️_']">
                      {getDisplayPath(file)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4">
              <Button onClick={handleCancel} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleLoadGltfModel} disabled={store.isLoading}>
                {store.isLoading ? 'Loading...' : 'Load Model'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
