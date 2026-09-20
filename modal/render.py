"""
AutoLyrics - Modal Render Function (Stub)
This is a placeholder for the actual Modal deployment.
When Modal is set up, this file will contain the FFmpeg render logic.
"""

import modal
import json

# Create Modal app
app = modal.App("autolyrics-render")

# Define the image with FFmpeg
image = modal.Image.debian_slim().apt_install("ffmpeg")


@app.function(
    image=image,
    timeout=600,  # 10 minutes max
    memory=2048,  # 2GB RAM
)
def render_video(job_id: str, audio_url: str, lyrics: str, template: str, user_id: str):
    """
    Render lyrics video from audio + lyrics.
    
    Args:
        job_id: Unique render job ID
        audio_url: URL to download audio from R2
        lyrics: Lyrics text (newline separated)
        template: Template ID (gradient-dark, neon, minimalist)
        user_id: User ID for database update
    
    Returns:
        dict with video_url and status
    """
    print(f"[Render] Starting job {job_id}")
    print(f"[Render] Audio: {audio_url}")
    print(f"[Render] Template: {template}")
    print(f"[Render] Lyrics lines: {len(lyrics.splitlines())}")
    
    # TODO: Implement actual FFmpeg render logic
    # 1. Download audio from R2
    # 2. Parse lyrics into lines
    # 3. Generate video with FFmpeg:
    #    - Background gradient based on template
    #    - Text overlay with fade in/out per line
    #    - Sync text with audio duration
    # 4. Upload result to R2
    # 5. Update database status
    
    # Placeholder: simulate render
    import time
    time.sleep(5)  # Simulate processing
    
    video_url = f"https://mock-r2-bucket.r2.cloudflarestorage.com/output/{job_id}.mp4"
    
    print(f"[Render] Completed job {job_id}")
    print(f"[Render] Video URL: {video_url}")
    
    return {
        "status": "done",
        "video_url": video_url,
        "job_id": job_id,
    }


# For local testing
if __name__ == "__main__":
    result = render_video.local(
        job_id="test-123",
        audio_url="https://example.com/audio.mp3",
        lyrics="Baris 1\nBaris 2\nBaris 3",
        template="gradient-dark",
        user_id="user-123",
    )
    print(json.dumps(result, indent=2))
