import { useEffect } from 'react';
import { useDaily, useLocalSessionId } from '@daily-co/daily-react';
import { CameraSettings } from '../CameraSettings';
import { Video } from '../Video';

export const HairCheckScreen = ({ handleJoin, handleEnd }:
  {
    handleJoin: () => void,
    handleEnd: () => void
  }
) => {
  const localSessionId = useLocalSessionId();
  const daily = useDaily();

  useEffect(() => {
    if (daily) {
      daily?.startCamera({ startVideoOff: false, startAudioOff: false });
    }
  }, [daily, localSessionId]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Camera & Microphone Check</h1>
          <p className="text-gray-600">Make sure your camera and microphone are working properly before joining the call</p>
        </div>

        {/* Video Container */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <Video
              id={localSessionId}
              className="max-h-[60vh] max-w-[80vw] w-full rounded-lg shadow-lg border-4 border-white"
            />
          </div>
        </div>

        {/* Camera Settings */}
        <CameraSettings
          actionLabel='Join Call'
          onAction={handleJoin}
          cancelLabel='Cancel'
          onCancel={handleEnd}
        />
      </div>
    </div>
  )
};