// URL validation and parsing
function isValidYouTubeURL(url) {
    const patterns = [
        /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /^https?:\/\/(www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
    ];
    return patterns.some(pattern => pattern.test(url));
}

function isValidPodcastURL(url) {
    return /^https?:\/\/.+\.(rss|xml|feed)/i.test(url) || 
           /feed/i.test(url) || 
           /podcast/i.test(url);
}

function extractYouTubeVideoId(url) {
    const patterns = [
        /[?&]v=([a-zA-Z0-9_-]{11})/,
        /youtu\.be\/([a-zA-Z0-9_-]{11})/,
        /embed\/([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// YouTube Transcript API (using multiple fallback methods)
async function getYouTubeTranscript(videoId) {
    // Method 1: Try using YouTube's transcript API directly
    try {
        const transcriptUrl = `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}`;
        const response = await fetch(transcriptUrl);
        
        if (response.ok) {
            const xmlText = await response.text();
            const transcript = parseYouTubeTranscriptXML(xmlText);
            if (transcript && transcript.length > 50) {
                return transcript;
            }
        }
    } catch (error) {
        console.log('Direct API call failed, trying proxy...');
    }
    
    // Method 2: Try using CORS proxy
    try {
        const transcriptUrl = `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}`;
        const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(transcriptUrl)}`;
        
        const response = await fetch(proxyUrl);
        if (response.ok) {
            const xmlText = await response.text();
            const transcript = parseYouTubeTranscriptXML(xmlText);
            if (transcript && transcript.length > 50) {
                return transcript;
            }
        }
    } catch (error) {
        console.log('Proxy method failed, trying alternative...');
    }
    
    // Method 3: Try alternative proxy
    try {
        const transcriptUrl = `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}`;
        const proxyUrl = `https://cors-anywhere.herokuapp.com/${transcriptUrl}`;
        
        const response = await fetch(proxyUrl);
        if (response.ok) {
            const xmlText = await response.text();
            const transcript = parseYouTubeTranscriptXML(xmlText);
            if (transcript && transcript.length > 50) {
                return transcript;
            }
        }
    } catch (error) {
        console.log('Alternative proxy failed');
    }
    
    // If all methods fail, provide helpful error message
    throw new Error(
        'Unable to fetch transcript due to CORS restrictions. ' +
        'Please set up a backend service (see README.md) or use a browser extension that disables CORS. ' +
        'Alternatively, ensure the video has captions enabled.'
    );
}

function parseYouTubeTranscriptXML(xmlText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const textElements = xmlDoc.getElementsByTagName('text');
    
    let transcript = '';
    for (let i = 0; i < textElements.length; i++) {
        const text = textElements[i].textContent.trim();
        if (text) {
            transcript += text + ' ';
        }
    }
    
    return transcript.trim();
}

// Get YouTube video info
async function getYouTubeVideoInfo(videoId) {
    try {
        // Using YouTube oEmbed API (no key required, but limited info)
        const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const response = await fetch(oEmbedUrl);
        
        if (!response.ok) {
            throw new Error('Failed to fetch video info');
        }
        
        const data = await response.json();
        return {
            title: data.title,
            author: data.author_name,
            thumbnail: data.thumbnail_url
        };
    } catch (error) {
        console.error('Error fetching video info:', error);
        return {
            title: 'Video',
            author: 'Unknown',
            thumbnail: null
        };
    }
}

// Generate summary using AI (client-side approach)
async function generateSummary(text) {
    if (!text || text.length < 50) {
        throw new Error('Transcript too short to generate summary');
    }
    
    // For client-side implementation, we'll use a simple extraction method
    // In production, you'd want to use OpenAI API, Anthropic, or similar
    
    // Simple extractive summary (first few sentences + key points)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const summaryLength = Math.min(5, Math.ceil(sentences.length * 0.2));
    const summary = sentences.slice(0, summaryLength).join('. ') + '.';
    
    // For a better summary, you'd call an AI API here:
    // const response = await fetch('YOUR_BACKEND_API/summarize', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ text })
    // });
    // const data = await response.json();
    // return data.summary;
    
    return {
        summary: summary,
        keyPoints: extractKeyPoints(text),
        wordCount: text.split(/\s+/).length
    };
}

function extractKeyPoints(text) {
    // Simple keyword extraction (in production, use NLP libraries or AI)
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they']);
    
    const wordFreq = {};
    words.forEach(word => {
        const cleanWord = word.replace(/[^\w]/g, '');
        if (cleanWord.length > 4 && !stopWords.has(cleanWord)) {
            wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
        }
    });
    
    const sortedWords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word);
    
    return sortedWords;
}

// Main summarization function
async function summarizeContent(url) {
    const loadingSection = document.getElementById('loadingSection');
    const resultsSection = document.getElementById('resultsSection');
    const errorMessage = document.getElementById('errorMessage');
    const loadingStatus = document.getElementById('loadingStatus');
    
    // Hide previous results and errors
    resultsSection.style.display = 'none';
    errorMessage.style.display = 'none';
    loadingSection.style.display = 'flex';
    
    try {
        let transcript = '';
        let videoInfo = null;
        
        if (isValidYouTubeURL(url)) {
            loadingStatus.textContent = 'Extracting YouTube video information...';
            const videoId = extractYouTubeVideoId(url);
            
            if (!videoId) {
                throw new Error('Invalid YouTube URL format');
            }
            
            videoInfo = await getYouTubeVideoInfo(videoId);
            loadingStatus.textContent = 'Fetching transcript...';
            
            transcript = await getYouTubeTranscript(videoId);
            
            if (!transcript || transcript.length < 50) {
                throw new Error('No transcript available for this video. The video may not have captions enabled.');
            }
        } else if (isValidPodcastURL(url)) {
            loadingStatus.textContent = 'Processing podcast feed...';
            throw new Error('Podcast RSS feed processing requires backend setup. Please use YouTube videos for now.');
        } else {
            throw new Error('Invalid URL. Please enter a valid YouTube URL.');
        }
        
        loadingStatus.textContent = 'Generating summary...';
        const summaryData = await generateSummary(transcript);
        
        // Display results
        displayResults(videoInfo, summaryData, transcript);
        
    } catch (error) {
        console.error('Error:', error);
        errorMessage.textContent = `Error: ${error.message}`;
        errorMessage.style.display = 'block';
    } finally {
        loadingSection.style.display = 'none';
    }
}

// Display results
function displayResults(videoInfo, summaryData, transcript) {
    const resultsSection = document.getElementById('resultsSection');
    const videoInfoDiv = document.getElementById('videoInfo');
    const summaryContent = document.getElementById('summaryContent');
    const transcriptContent = document.getElementById('transcriptContent');
    const transcriptContainer = document.getElementById('transcriptContainer');
    
    // Display video info
    if (videoInfo) {
        videoInfoDiv.innerHTML = `
            <div class="video-info-content">
                ${videoInfo.thumbnail ? `<img src="${videoInfo.thumbnail}" alt="Thumbnail" class="video-thumbnail">` : ''}
                <div class="video-details">
                    <h3>${videoInfo.title}</h3>
                    <p class="video-author">by ${videoInfo.author}</p>
                    <p class="video-stats">Transcript: ${summaryData.wordCount} words</p>
                </div>
            </div>
        `;
    }
    
    // Display summary
    summaryContent.innerHTML = `
        <div class="summary-text">${summaryData.summary}</div>
        ${summaryData.keyPoints && summaryData.keyPoints.length > 0 ? `
            <div class="key-points">
                <h3>Key Topics:</h3>
                <ul>
                    ${summaryData.keyPoints.map(point => `<li>${point}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
    `;
    
    // Display transcript (collapsed by default)
    transcriptContent.textContent = transcript;
    transcriptContainer.style.display = 'block';
    
    // Show results
    resultsSection.style.display = 'block';
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('urlInput');
    const summarizeBtn = document.getElementById('summarizeBtn');
    const btnText = summarizeBtn.querySelector('.btn-text');
    const btnLoader = summarizeBtn.querySelector('.btn-loader');
    
    // Handle Enter key
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            summarizeBtn.click();
        }
    });
    
    // Handle summarize button click
    summarizeBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        
        if (!url) {
            document.getElementById('errorMessage').textContent = 'Please enter a URL';
            document.getElementById('errorMessage').style.display = 'block';
            return;
        }
        
        // Update button state
        summarizeBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline';
        
        try {
            await summarizeContent(url);
        } finally {
            // Reset button state
            summarizeBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
        }
    });
    
    // Auto-focus input
    urlInput.focus();
});
