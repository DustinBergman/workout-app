import { FC } from 'react';
import { useModal } from '../../contexts/ModalContext';
import { useAppStore } from '../../store/useAppStore';
import { Modal } from '../ui';
import { AvatarUpload } from '../profile';
import { useAvatar, updateCachedAvatar } from '../../hooks/useAvatar';
import { useAuth } from '../../hooks/useAuth';

interface AvatarEditModalWrapperProps {
  onAvatarChange?: (url: string | null) => void;
}

export const AvatarEditModalWrapper: FC<AvatarEditModalWrapperProps> = ({ onAvatarChange }) => {
  const { closeModal } = useModal();
  const { user } = useAuth();
  const preferences = useAppStore((state) => state.preferences);
  const { avatarUrl } = useAvatar(user?.id);

  const handleAvatarChange = (url: string | null) => {
    if (user?.id) {
      updateCachedAvatar(user.id, url);
    }
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
