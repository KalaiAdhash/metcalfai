import { useEffect } from 'react';
import { useDaily } from '@daily-co/daily-react';
import { IConversation } from '@/types';
import { CameraSettings } from '../CameraSettings';


import { Call } from '../Call';

export const CallScreen = ({ conversation, handleEnd }: { conversation: IConversation, handleEnd: () => void }) => {
  const daily = useDaily();

  useEffect(() => {
    if (conversation && daily) {
      const { conversation_url } = conversation;
      daily.join({
        url: conversation_url,
      });
    }
  }, [daily, conversation]);

  const handleLeave = async () => {
    await daily?.leave();
    handleEnd();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tavus Conversation</h1>
          <p className="text-gray-600">You're now connected to your AI assistant</p>
        </div>

        {/* Call Interface */}
        <div className="flex justify-center mb-8">
          <Call />
        </div>

        {/* Call Controls */}
        <CameraSettings
          actionLabel='Leave Call'
          onAction={handleLeave}
        />
      </div>
    </div>
  );
};
