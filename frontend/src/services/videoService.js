import axios from 'axios';

// PRODUCTION: Use environment variable or fallback to relative path (proxy)
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

class VideoService {
  // Get all videos
  async getAllVideos() {
    try {
      const response = await api.get('/videos');
      return response.data;
    } catch (error) {
      console.error('Error fetching videos:', error);
      throw error;
    }
  }

  // Get single video by ID
  async getVideoById(id) {
    try {
      const response = await api.get(`/videos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching video:', error);
      throw error;
    }
  }

  // Upload video with metadata
  async uploadVideo(file, title, duration = '', thumbnail = null) {
    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('title', title);

      // Always send duration (fix undefined issue)
      formData.append('duration', duration || "0:00");

      if (thumbnail) {
        formData.append('thumbnail', thumbnail);
      }

      const response = await api.post('/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload progress: ${percentCompleted}%`);
        },
        timeout: 600000, // 10 minutes
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }
  }

  // Add video by file_code (Abyss.to file ID)
  async addVideoByCode(fileCode, title, duration = '') {
    try {
      const response = await api.post('/videos/add', {
        file_code: fileCode,
        title: title,
        duration: duration || "0:00",
      });
      return response.data;
    } catch (error) {
      console.error('Error adding video:', error);
      throw error;
    }
  }

  // Delete video
  async deleteVideo(id) {
    try {
      const response = await api.delete(`/videos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  }

  // Get embed URL
  async getEmbedUrl(id) {
    try {
      const response = await api.get(`/videos/${id}/embed`);
      return response.data;
    } catch (error) {
      console.error('Error getting embed URL:', error);
      throw error;
    }
  }

  // Generate embed URL from file_code (client-side, no API call needed)
  getEmbedUrlFromCode(fileCode) {
    return `https://abyss.to/embed/${fileCode}`;
  }
}

// ✅ FIX: no anonymous export (Netlify ESLint fix)
const videoService = new VideoService();
export default videoService;
