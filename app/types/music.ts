export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string;
  audioUrl: string;
  coverUrl?: string;
  userId?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  storagePath?: string;
  ownerId?: string;
  sharedFromUserId?: string;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverUrl?: string;
  songs: Song[];
  ownerId?: string;
  updatedAt?: string;
}
