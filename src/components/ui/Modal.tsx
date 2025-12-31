import { ReactNode, FC } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export const Modal: FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50',
            'w-full',
            'bg-background rounded-t-2xl shadow-xl border-t border-x border-border',
            'h-[70vh] overflow-hidden flex flex-col',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
            'duration-200'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <DialogPrimitive.Title className="text-lg font-semibold text-foreground">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              className={cn(
                'rounded-md p-1.5 text-muted-foreground transition-colors',
                'hover:bg-accent hover:text-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              )}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto overflow-x-hidden flex-1">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="p-4 border-t border-border flex justify-end gap-2">
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
