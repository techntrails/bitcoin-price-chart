# Podcast & Video Summarizer

A web application that extracts transcripts from YouTube videos and generates intelligent summaries.

## Features

- 🎥 **YouTube Video Support**: Extract transcripts from YouTube videos
- 📝 **AI-Powered Summaries**: Generate concise summaries with key points
- 🎨 **Modern UI**: Clean, responsive interface
- ⚡ **Fast Processing**: Quick transcript extraction and summarization

## How to Use

1. Open `index.html` in a web browser
2. Paste a YouTube video URL (e.g., `https://www.youtube.com/watch?v=...`)
3. Click "Summarize"
4. View the generated summary and transcript

## Current Limitations

The current implementation uses client-side transcript extraction, which has some limitations:

- **CORS Issues**: YouTube's transcript API may be blocked by CORS policies when accessed directly from the browser
- **Basic Summarization**: Uses extractive summarization (first sentences) rather than AI-powered abstractive summaries

## Recommended Setup for Production

For better functionality, consider setting up a backend service:

### Option 1: Use a Backend API

Create a backend endpoint that:
1. Extracts transcripts using `youtube-transcript-api` (Python) or similar
2. Generates summaries using OpenAI API, Anthropic Claude, or similar AI service
3. Returns the summary to the frontend

### Option 2: Use Browser Extensions

For local development, you can use browser extensions that disable CORS, or run a local server.

### Example Backend Implementation (Python/Flask)

```python
from flask import Flask, request, jsonify
from youtube_transcript_api import YouTubeTranscriptApi
import openai

app = Flask(__name__)

@app.route('/summarize', methods=['POST'])
def summarize():
    data = request.json
    video_id = data.get('video_id')
    
    # Get transcript
    transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
    transcript = ' '.join([item['text'] for item in transcript_list])
    
    # Generate summary using OpenAI
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that summarizes video transcripts."},
            {"role": "user", "content": f"Summarize this transcript:\n\n{transcript}"}
        ]
    )
    
    return jsonify({
        'summary': response.choices[0].message.content,
        'transcript': transcript
    })
```

Then update `app.js` to call your backend API instead of the direct YouTube API.

## Browser Compatibility

Works best in modern browsers (Chrome, Firefox, Safari, Edge).

## License

MIT

