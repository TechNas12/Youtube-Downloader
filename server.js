const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Create downloads directory if it doesn't exist
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir);
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Validate YouTube URL
app.post('/api/validate', async (req, res) => {
  const { url } = req.body;
  
  try {
    // Basic validation
    const isValid = ytdl.validateURL(url);
    
    if (isValid) {
      try {
        // Get video ID for thumbnail
        const videoId = ytdl.getVideoID(url);
        
        // Return video details with predefined quality options
        return res.json({ 
          valid: true, 
          videoDetails: {
            title: "YouTube Video",
            thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            videoId: videoId,
            formats: [
              { quality: "1080p", itag: "137", format_id: "137" },
              { quality: "720p", itag: "22", format_id: "22" },
              { quality: "480p", itag: "135", format_id: "135" },
              { quality: "Music (.wav)", itag: "251", format_id: "251" }
            ]
          }
        });
      } catch (error) {
        console.error('Error processing URL:', error);
        return res.json({ valid: false, message: 'Error processing YouTube URL' });
      }
    } else {
      return res.json({ valid: false, message: 'Invalid YouTube URL' });
    }
  } catch (error) {
    console.error('Error validating URL:', error);
    return res.status(500).json({ 
      valid: false, 
      message: 'Error validating YouTube URL'
    });
  }
});

// Download YouTube video - Direct method
app.get('/api/download', async (req, res) => {
  const { url, itag } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  try {
    // Set headers to enable direct download through browser
    res.header('Content-Disposition', 'attachment');
    
    // Choose audio-only for music option
    if (itag === '251') {
      ytdl(url, {
        filter: 'audioonly',
        quality: 'highestaudio'
      }).pipe(res);
    } else {
      // Map itag to quality labels that include both audio and video
      let qualityLabel;
      switch (itag) {
        case '137': // 1080p
          qualityLabel = 'highest';
          break;
        case '22': // 720p
          qualityLabel = '720p';
          break;
        case '135': // 480p
          qualityLabel = '480p';
          break;
        default:
          qualityLabel = 'highest';
      }
      
      // Use quality label filter which will include both audio and video
      ytdl(url, {
        filter: format => {
          return format.hasAudio && format.hasVideo;
        },
        quality: qualityLabel
      }).pipe(res);
    }
  } catch (error) {
    console.error('Error downloading:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Download failed' });
    }
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 