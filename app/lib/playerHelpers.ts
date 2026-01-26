import type { UniversalTrack } from '../context/UniversalPlayerContext';

export function createUniversalTrack(
  id: string,
  title: string,
  artist?: string,
  platform?: string,
  platformId?: string,
  options: { thumbnail?: string; duration?: number; album?: string } = {}
): UniversalTrack {
  return {
    id,
    title,
    artist,
    platform,
    thumbnail: options.thumbnail,
    audioUrl: platform === 'direct' ? platformId : undefined,
  } as UniversalTrack;
}

export function convertLegacyTrack(legacyTrack: {
  id: string;
  title: string;
  artist?: string;
  platform?: string;
  playableUrl?: string;
  thumbnail?: string;
  description?: string;
}): UniversalTrack {
  return createUniversalTrack(
    legacyTrack.id,
    legacyTrack.title,
    legacyTrack.artist,
    legacyTrack.platform,
    legacyTrack.playableUrl,
    {
      thumbnail: legacyTrack.thumbnail,
      album: legacyTrack.description,
    }
  );
}
