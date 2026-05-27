export function highQualityYouTubeThumbnail(videoId: string) {
  return `https://i.ytimg.com/vi/${videoId}/hq720.jpg`;
}

export function fallbackYouTubeThumbnail(videoId: string) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}
