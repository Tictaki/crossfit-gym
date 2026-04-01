/**
 * Utility to resolve image URLs.
 * Detects if a path is a full URL (e.g., Cloudinary) or a legacy local upload path.
 */
export const resolveImageUrl = (imagePath) => {
  if (!imagePath) return null;

  // If it's already a full URL (Cloudinary or elsewhere), return it as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If it's a legacy local path (e.g., 'uploads/members/xyz.png'),
  // prepend the BACKEND_URL to make it reachable.
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  
  // Normalize path separators to forward slashes
  let normalizedPath = imagePath.replace(/\\/g, '/');
  
  // Ensure it doesn't double-slash or miss the leading slash
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = '/' + normalizedPath;
  }

  return `${baseUrl}${normalizedPath}`;
};
