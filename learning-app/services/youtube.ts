//AIzaSyCkIZHhc47Rb1ZiAfWv1BRxAJG2Ly7PVjc


import axios from 'axios';

const YOUTUBE_API_KEY = 'AIzaSyCkIZHhc47Rb1ZiAfWv1BRxAJG2Ly7PVjc';

export function extractPlaylistId(url: string): string | null {
  // Handle different URL formats
  const patterns = [
    /[?&]list=([^#\&\?]+)/, // Standard URL
    /youtu.be\/.*[?&]list=([^#\&\?]+)/, // Short URL
    /youtube.com\/playlist\?list=([^#\&\?]+)/ // Playlist URL
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function getPlaylistDetails(playlistId: string) {
  try {
    // First get playlist info
    const playlistResponse = await axios.get(
      'https://www.googleapis.com/youtube/v3/playlists',
      {
        params: {
          part: 'snippet',
          id: playlistId,
          key: YOUTUBE_API_KEY
        }
      }
    );

    const playlistTitle = playlistResponse.data.items[0]?.snippet?.title || 'Untitled Playlist';

    // Then get all playlist items
    let allItems: any[] = [];
    let nextPageToken: string | undefined;

    do {
      const response = await axios.get(
        'https://www.googleapis.com/youtube/v3/playlistItems',
        {
          params: {
            part: 'snippet,contentDetails',
            playlistId: playlistId,
            maxResults: 50,
            pageToken: nextPageToken,
            key: YOUTUBE_API_KEY
          }
        }
      );

      allItems = [...allItems, ...response.data.items];
      nextPageToken = response.data.nextPageToken;
    } while (nextPageToken);

    // Get video details in batches of 50
    const videoIds = allItems.map(item => item.contentDetails.videoId);
    const videos: any[] = [];

    for (let i = 0; i < videoIds.length; i += 50) {
      const batch = videoIds.slice(i, i + 50);
      const videosResponse = await axios.get(
        'https://www.googleapis.com/youtube/v3/videos',
        {
          params: {
            part: 'contentDetails,snippet',
            id: batch.join(','),
            key: YOUTUBE_API_KEY
          }
        }
      );

      videos.push(...videosResponse.data.items.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        duration: item.contentDetails.duration
      })));
    }

    const totalDuration = calculateTotalDuration(videos);

    return {
      title: playlistTitle,
      totalVideos: videos.length,
      totalDuration,
      videos
    };
  } catch (error: any) {
    console.error('Error fetching playlist:', error.response?.data || error);
    if (error.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    }
    throw new Error('Failed to fetch playlist details');
  }
}

function calculateTotalDuration(videos: any[]): number {
  return videos.reduce((total, video) => {
    return total + parseDuration(video.duration);
  }, 0);
}

function parseDuration(duration: string): number {
  const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!matches) return 0;
  
  const hours = parseInt(matches[1] || '0');
  const minutes = parseInt(matches[2] || '0');
  const seconds = parseInt(matches[3] || '0');
  
  return hours * 3600 + minutes * 60 + seconds;
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
}