document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const urlForm = document.getElementById('url-form');
  const youtubeUrlInput = document.getElementById('youtube-url');
  const errorMessage = document.getElementById('error-message');
  const videoInfo = document.getElementById('video-info');
  const videoTitle = document.getElementById('video-title');
  const videoThumbnail = document.getElementById('video-thumbnail');
  const qualityOptions = document.getElementById('quality-options');
  const downloadBtn = document.getElementById('download-btn');
  const loader = document.getElementById('loader');
  const downloadStatus = document.getElementById('download-status');
  const downloadProgress = document.getElementById('download-progress');
  const downloadMessage = document.getElementById('download-message');

  // Current video data
  let currentVideoData = null;
  let isDownloading = false;

  // Event listeners
  urlForm.addEventListener('submit', validateYoutubeUrl);
  downloadBtn.addEventListener('click', downloadVideo);

  // Validate YouTube URL
  async function validateYoutubeUrl(e) {
    e.preventDefault();
    
    // Reset UI state
    errorMessage.textContent = '';
    videoInfo.classList.add('hidden');
    downloadStatus.classList.add('hidden');
    downloadProgress.style.width = '0%';
    loader.classList.remove('hidden');
    
    const youtubeUrl = youtubeUrlInput.value.trim();
    
    // Basic validation
    if (!youtubeUrl) {
      showError('Please enter a YouTube URL');
      loader.classList.add('hidden');
      return;
    }
    
    try {
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: youtubeUrl })
      });
      
      const data = await response.json();
      
      if (!data.valid) {
        showError(data.message || 'Invalid YouTube URL');
        loader.classList.add('hidden');
        return;
      }
      
      // Store video data
      currentVideoData = {
        url: youtubeUrl,
        title: data.videoDetails.title,
        thumbnailUrl: data.videoDetails.thumbnailUrl,
        videoId: data.videoDetails.videoId,
        formats: data.videoDetails.formats
      };
      
      // Display video info
      displayVideoInfo(currentVideoData);
      
    } catch (error) {
      console.error('Error:', error);
      showError('An error occurred. Please try again.');
    } finally {
      loader.classList.add('hidden');
    }
  }
  
  // Display video information and quality options
  function displayVideoInfo(videoData) {
    videoTitle.textContent = videoData.title;
    
    // Set thumbnail
    if (videoData.thumbnailUrl) {
      videoThumbnail.src = videoData.thumbnailUrl;
      videoThumbnail.alt = `${videoData.title} thumbnail`;
    }
    
    // Clear previous quality options
    qualityOptions.innerHTML = '';
    
    // Define hardcoded quality options
    const predefinedQualities = [
      { label: '1080p', itag: "137" },
      { label: '720p', itag: "22" },
      { label: '480p', itag: "135" },
      { label: 'Music (.wav)', itag: "251" }
    ];
    
    // Create dropdown options for predefined qualities
    predefinedQualities.forEach(quality => {
      const option = document.createElement('option');
      option.value = quality.itag;
      option.textContent = quality.label;
      qualityOptions.appendChild(option);
    });
    
    // Show video info section
    videoInfo.classList.remove('hidden');
  }
  
  // Download the selected video
  function downloadVideo() {
    if (!currentVideoData || isDownloading) return;
    
    // Get selected quality (itag)
    const selectedQuality = qualityOptions.value;
    
    if (!selectedQuality) {
      showError('Please select a quality option');
      return;
    }
    
    const itag = selectedQuality;
    
    // Show download status
    downloadStatus.classList.remove('hidden');
    downloadMessage.textContent = 'Starting download...';
    downloadProgress.style.width = '10%';
    isDownloading = true;
    downloadBtn.disabled = true;
    
    // Create download URL
    const downloadUrl = `/api/download?url=${encodeURIComponent(currentVideoData.url)}&itag=${itag}`;
    
    // Use direct browser download
    const fileExtension = itag === '251' ? '.wav' : '.mp4';
    const fileName = `${currentVideoData.title || 'youtube-video'}${fileExtension}`;
    
    // Create a hidden link to trigger the download
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    
    // Start download and show progress
    let progress = 10;
    const progressInterval = setInterval(() => {
      if (progress < 90) {
        progress += Math.random() * 5;
        downloadProgress.style.width = `${progress}%`;
      }
    }, 500);
    
    // Trigger the download
    a.click();
    
    // Finish after a delay to give time for the download to start
    setTimeout(() => {
      clearInterval(progressInterval);
      downloadProgress.style.width = '100%';
      downloadMessage.textContent = 'Download started! Check your downloads folder.';
      
      // Clean up
      document.body.removeChild(a);
      
      // Reset after a delay
      setTimeout(() => {
        isDownloading = false;
        downloadBtn.disabled = false;
      }, 2000);
    }, 3000);
  }
  
  // Display error message
  function showError(message) {
    errorMessage.textContent = message;
  }
}); 