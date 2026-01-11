import { FC, useRef, useState } from 'react';
import { Card, Button, Avatar, Modal } from '../ui';
import { StepNavigation } from './StepNavigation';
import { uploadAvatar, validateAvatarFile } from '../../services/supabase/avatar';
import { ImageCropper } from '../profile/ImageCropper';

export interface ProfilePictureStepProps {
  onBack: () => void;
  onNext: () => void;
  onAvatarUpload: (url: string | null) => void;
}

export const ProfilePictureStep: FC<ProfilePictureStepProps> = ({
  onBack,
  onNext,
  onAvatarUpload,
}) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateAvatarFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setError(null);

    // Show cropper
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageToCrop(e.target?.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setCroppedBlob(blob);
    setShowCropper(false);
    setImageToCrop(null);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setImageToCrop(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (libraryInputRef.current) libraryInputRef.current.value = '';
  };

  const handleNext = async () => {
    if (!croppedBlob) {
      // Skip - no photo selected
      onAvatarUpload(null);
      onNext();
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
      const { url, error: uploadError } = await uploadAvatar(file);
      if (uploadError) {
        setError(uploadError.message);
        setIsUploading(false);
      } else {
        // Clean up preview URL
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        onAvatarUpload(url);
        onNext();
      }
    } catch {
      setError('Failed to upload photo');
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setCroppedBlob(null);
    setError(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (libraryInputRef.current) libraryInputRef.current.value = '';
  };

  return (
    <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Add a Profile Picture
        </h2>
        <p className="text-muted-foreground">
          Help friends recognize you (optional)
        </p>
      </div>

      <div className="flex-1 space-y-6 mb-6">
        <Card padding="lg" className="flex flex-col items-center">
          {/* Avatar preview */}
          <div className="mb-4">
            <Avatar
              src={previewUrl}
              name="You"
              size="xl"
              className="w-24 h-24"
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 w-full">
            <Button
              type="button"
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
              type="button"
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

            {previewUrl && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleRemove}
                disabled={isUploading}
                className="w-full"
              >
                Remove
              </Button>
            )}
          </div>

          {error && (
            <p className="mt-3 text-sm text-destructive">{error}</p>
          )}

          <p className="mt-4 text-xs text-muted-foreground text-center">
            JPEG, PNG, WebP, or GIF up to 5MB
          </p>
        </Card>
      </div>

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

      <StepNavigation
        onBack={onBack}
        onNext={handleNext}
        nextLabel={previewUrl ? (isUploading ? 'Uploading...' : 'Next') : 'Skip'}
        nextDisabled={isUploading}
      />
    </div>
  );
};
