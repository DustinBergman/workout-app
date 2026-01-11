import { FC, useRef, useState } from 'react';
import { Avatar, Button, Modal } from '../ui';
import { uploadAvatar, deleteAvatar, validateAvatarFile } from '../../services/supabase/avatar';
import { toast } from '../../store/toastStore';
import { ImageCropper } from './ImageCropper';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userName?: string | null;
  onAvatarChange: (url: string | null) => void;
  size?: 'lg' | 'xl';
}

export const AvatarUpload: FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  userName,
  onAvatarChange,
  size = 'xl',
}) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate
    const validation = validateAvatarFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file');
      return;
    }

    // Show cropper
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageToCrop(e.target?.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (blob: Blob) => {
    // Create preview URL from cropped blob
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setCroppedBlob(blob);
    setShowCropper(false);
    setImageToCrop(null);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setImageToCrop(null);
    // Reset file inputs
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (libraryInputRef.current) libraryInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!croppedBlob) return;

    setIsUploading(true);
    try {
      // Create a File from the cropped blob
      const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
      const { url, error } = await uploadAvatar(file);
      if (error) {
        toast.error(error.message);
      } else if (url) {
        onAvatarChange(url);
        toast.success('Profile picture updated');
        // Clean up preview URL
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setCroppedBlob(null);
      }
    } finally {
      setIsUploading(false);
      // Reset file inputs
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (libraryInputRef.current) libraryInputRef.current.value = '';
    }
  };

  const handleCancel = () => {
    // Clean up preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setCroppedBlob(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (libraryInputRef.current) libraryInputRef.current.value = '';
  };

  const handleDelete = async () => {
    setIsUploading(true);
    try {
      const { error } = await deleteAvatar();
      if (error) {
        toast.error(error.message);
      } else {
        onAvatarChange(null);
        toast.success('Profile picture removed');
      }
    } finally {
      setIsUploading(false);
      setShowDeleteConfirm(false);
    }
  };

  // Show preview mode with confirm/cancel
  if (previewUrl) {
    return (
      <div className="flex flex-col items-center gap-4">
        <Avatar
          src={previewUrl}
          name={userName}
          size={size}
          className={size === 'xl' ? 'w-24 h-24' : 'w-16 h-16'}
        />
        <p className="text-sm text-muted-foreground">Preview</p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Uploading...
              </div>
            ) : (
              'Use Photo'
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar
          src={currentAvatarUrl}
          name={userName}
          size={size}
          className={size === 'xl' ? 'w-24 h-24' : 'w-16 h-16'}
        />
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Mobile-friendly buttons: Take Photo and Choose from Library */}
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <Button
          variant="outline"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isUploading}
          className="w-full"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Take Photo
        </Button>
        <Button
          variant="outline"
          onClick={() => libraryInputRef.current?.click()}
          disabled={isUploading}
          className="w-full"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Choose from Library
        </Button>

        {currentAvatarUrl && (
          <Button
            variant="ghost"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isUploading}
            className="w-full text-destructive hover:text-destructive"
          >
            Remove Photo
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        JPEG, PNG, WebP, or GIF up to 5MB
      </p>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={libraryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Remove Profile Picture"
      >
        <p className="text-muted-foreground mb-4">
          Are you sure you want to remove your profile picture?
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setShowDeleteConfirm(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={handleDelete}
            disabled={isUploading}
          >
            {isUploading ? 'Removing...' : 'Remove'}
          </Button>
        </div>
      </Modal>

      {/* Cropper modal */}
      <Modal
        isOpen={showCropper}
        onClose={handleCropCancel}
        title="Crop Photo"
      >
        {imageToCrop && (
          <ImageCropper
            imageSrc={imageToCrop}
            onCropComplete={handleCropComplete}
            onCancel={handleCropCancel}
          />
        )}
      </Modal>
    </div>
  );
};
