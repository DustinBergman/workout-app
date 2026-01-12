import { FC, useState, useEffect } from 'react';
import { useModal } from '../../contexts/ModalContext';
import { useAppStore } from '../../store/useAppStore';
import { Modal } from '../ui';
import { AvatarUpload } from '../profile';
import { getProfile } from '../../services/supabase';

interface AvatarEditModalWrapperProps {
  onAvatarChange?: (url: string | null) => void;
}

export const AvatarEditModalWrapper: FC<AvatarEditModalWrapperProps> = ({ onAvatarChange }) => {
  const { closeModal } = useModal();
  const preferences = useAppStore((state) => state.preferences);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadAvatar = async () => {
      const { profile } = await getProfile();
      if (profile?.avatar_url) {
        setAvatarUrl(profile.avatar_url);
      }
    };
    loadAvatar();
  }, []);

  const handleAvatarChange = (url: string | null) => {
    setAvatarUrl(url);
    onAvatarChange?.(url);
    closeModal();
  };

  return (
    <Modal
      isOpen={true}
      onClose={closeModal}
      title="Profile Picture"
    >
      <AvatarUpload
        currentAvatarUrl={avatarUrl}
        userName={preferences.firstName}
        onAvatarChange={handleAvatarChange}
      />
    </Modal>
  );
};
