import { FC } from 'react';
import { Button } from '../ui';

interface DisclaimerModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const DisclaimerModal: FC<DisclaimerModalProps> = ({
  isOpen,
  onAccept,
  onDecline,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-background rounded-xl shadow-2xl border border-border max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Important Disclaimer</h2>
          <p className="text-sm text-muted-foreground mt-1">Please read carefully before continuing</p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-4 text-sm text-foreground">
            <p className="font-semibold text-destructive">
              PLEASE READ THIS DISCLAIMER CAREFULLY BEFORE USING THIS APPLICATION.
            </p>

            <div>
              <h3 className="font-semibold mb-2">No Medical or Professional Advice</h3>
              <p className="text-muted-foreground">
                The information, workout suggestions, and AI-generated recommendations provided by this
                application are for general informational and educational purposes only. They do not
                constitute medical advice, professional fitness training, or personalized health guidance.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">AI Suggestions Are Not Professional Guidance</h3>
              <p className="text-muted-foreground">
                All AI-generated suggestions, including workout plans, exercise recommendations, weight
                suggestions, and progress analysis, are automated outputs based on general fitness principles.
                These suggestions are NOT reviewed by certified personal trainers, medical professionals,
                or fitness experts, and should not be treated as professional advice.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">User Responsibility</h3>
              <p className="text-muted-foreground">
                By using this application, you acknowledge and agree that:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>You are solely responsible for ensuring proper exercise form and technique</li>
                <li>You are solely responsible for selecting appropriate weights for your fitness level</li>
                <li>You should consult a qualified healthcare provider before beginning any exercise program</li>
                <li>You should consult a certified personal trainer if you are unsure about proper form</li>
                <li>You understand your own physical limitations and will exercise within them</li>
                <li>You will stop exercising immediately if you experience pain, dizziness, or discomfort</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Assumption of Risk</h3>
              <p className="text-muted-foreground">
                Physical exercise carries inherent risks including but not limited to injury, disability,
                and death. By using this application, you voluntarily assume all risks associated with
                your exercise activities. The developers and operators of this application shall not be
                liable for any injuries, damages, or losses arising from your use of the application or
                reliance on its suggestions.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Limitation of Liability</h3>
              <p className="text-muted-foreground">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE APPLICATION AND ITS DEVELOPERS DISCLAIM ALL
                WARRANTIES, EXPRESS OR IMPLIED, AND SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT,
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THIS
                APPLICATION OR ANY AI-GENERATED SUGGESTIONS.
              </p>
            </div>

            <p className="font-semibold pt-2">
              By clicking "I Accept", you confirm that you have read, understood, and agree to this
              disclaimer and accept full responsibility for your fitness activities.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex gap-3">
          <Button
            variant="outline"
            onClick={onDecline}
            className="flex-1"
          >
            Decline
          </Button>
          <Button
            onClick={onAccept}
            className="flex-1"
          >
            I Accept
          </Button>
        </div>
      </div>
    </div>
  );
};
