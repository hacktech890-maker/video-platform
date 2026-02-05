import axios from "axios";

// PRODUCTION: Use environment variable or fallback to relative path (proxy)
const API_BASE_URL = process.env.REACT_APP_API_URL || "/api";

console.log("API Base URL:", API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
});

class VideoService {
  // ==========================
  // ✅ PUBLIC APIs
  // ==========================

  // Get all videos
  async getAllVideos() {
    try {
      const response = await api.get("/videos");
      return response.data;
    } catch (error) {
      console.error("Error fetching videos:", error);
      throw error;
    }
  }

  // Get single video by ID
  async getVideoById(id) {
    try {
      const response = await api.get(`/videos/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching video:", error);
      throw error;
    }
  }

  // Get embed URL
  async getEmbedUrl(id) {
    try {
      const response = await api.get(`/videos/${id}/embed`);
      return response.data;
    } catch (error) {
      console.error("Error getting embed URL:", error);
      throw error;
    }
  }

  // Generate embed URL from embed_code (short.icu system)
  getEmbedUrlFromCode(embedCode) {
    return `https://short.icu/${embedCode}`;
  }

  // ==========================
  // ✅ ADMIN APIs
  // ==========================

  // Upload video with metadata (ADMIN PASSWORD REQUIRED)
  // onProgress is optional callback
  async uploadVideo(
    file,
    title,
    duration = "0:00",
    thumbnail = null,
    adminPassword,
    onProgress = null
  ) {
    try {
      const formData = new FormData();
      formData.append("video", file);
      formData.append("title", title);
      formData.append("duration", duration || "0:00");

      if (thumbnail) {
        formData.append("thumbnail", thumbnail);
      }

      const response = await api.post("/videos/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "x-admin-password": adminPassword,
        },
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;

          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );

          // Console log
          console.log(`Upload progress: ${percentCompleted}%`);

          // Callback for UI queue progress
          if (onProgress) {
            onProgress(percentCompleted);
          }
        },
        timeout: 600000, // 10 minutes
      });

      return response.data;
    } catch (error) {
      console.error("Error uploading video:", error);
      throw error;
    }
  }

  // Add video by file_code (ADMIN PASSWORD REQUIRED)
  async addVideoByCode(fileCode, title, duration = "0:00", adminPassword) {
    try {
      const response = await api.post(
        "/videos/add",
        {
          file_code: fileCode,
          title: title,
          duration: duration || "0:00",
        },
        {
          headers: {
            "x-admin-password": adminPassword,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error adding video:", error);
      throw error;
    }
  }

  // Delete video (ADMIN PASSWORD REQUIRED)
  async deleteVideo(id, adminPassword) {
    try {
      const response = await api.delete(`/videos/${id}`, {
        headers: {
          "x-admin-password": adminPassword,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error deleting video:", error);
      throw error;
    }
  }

  // Admin verify password (for dashboard login system)
  async verifyAdmin(adminPassword) {
    try {
      const response = await api.post(
        "/admin/verify",
        {},
        {
          headers: {
            "x-admin-password": adminPassword,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Admin verify failed:", error);
      throw error;
    }
  }

  // Admin dashboard stats (optional future)
  async getAdminStats(adminPassword) {
    try {
      const response = await api.get("/admin/stats", {
        headers: {
          "x-admin-password": adminPassword,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Admin stats fetch failed:", error);
      throw error;
    }
  }
}

// Export instance
const videoService = new VideoService();
export default videoService;
