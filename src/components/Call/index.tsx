import { DailyAudio, useParticipantIds, useLocalSessionId } from '@daily-co/daily-react';

import { Video } from '../Video';

export const Call = () => {
  const remoteParticipantIds = useParticipantIds({ filter: 'remote' });
  const localSessionId = useLocalSessionId();

  return <>
    <div className="flex items-center justify-center w-full h-full">
      <div className='relative w-full h-full'>
        {
          remoteParticipantIds.length > 0 ?
            <Video
              id={remoteParticipantIds[0]}
              className="w-full h-full rounded-lg shadow-md object-cover"
            /> :
            <div className="relative flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 w-full h-full">
              <p className="text-gray-600 text-center text-base">Waiting for others to join...</p>
            </div>
        }
        {localSessionId && (
          <Video
            id={localSessionId}
            className="absolute bottom-2 right-2 border-2 border-white rounded-md shadow-sm w-32 h-24"
          />
        )}
      </div>
    </div>
    <DailyAudio />
  </>
}