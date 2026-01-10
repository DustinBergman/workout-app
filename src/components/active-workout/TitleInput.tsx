import { FC, useState } from 'react';
import { Input, Button } from '../ui';

export interface TitleInputProps {
  defaultName: string;
  onSubmit: (title: string | null) => void;
}

export const TitleInput: FC<TitleInputProps> = ({ defaultName, onSubmit }) => {
  const [title, setTitle] = useState('');

  const handleSave = () => {
    const trimmedTitle = title.trim();
    onSubmit(trimmedTitle || null);
  };

  const handleSkip = () => {
    onSubmit(null);
  };

  return (
    <div className="text-center py-6">
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Give your workout a title
      </h3>
      <p className="text-muted-foreground mb-6">Optional - personalize your workout</p>
      <div className="px-4 mb-6">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={defaultName}
          className="text-center"
          autoFocus
        />
      </div>
      <div className="flex gap-3 justify-center">
        <Button variant="ghost" onClick={handleSkip}>
          Skip
        </Button>
        <Button onClick={handleSave}>
          {title.trim() ? 'Save' : 'Use Default'}
        </Button>
      </div>
    </div>
  );
};
