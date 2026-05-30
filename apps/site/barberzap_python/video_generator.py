"""
OpenAI Sora API Video Generator Wrapper
========================================
Gerador de vídeos usando OpenAI Sora API (quando disponível)
e providers alternativos: RunwayML Gen-2, Stability AI Video

Author: BarberZap AI
Date: 2026-02-24
"""

import os
import json
import time
import requests
from typing import Optional, Dict, Any
from dataclasses import dataclass


@dataclass
class VideoGenerationRequest:
    """Request parameters for video generation"""
    prompt: str
    model: str = "openai_sora"
    duration: int = 10  # seconds
    resolution: str = "1080p"
    aspect_ratio: str = "16:9"
    style: Optional[str] = None
    negative_prompt: Optional[str] = None


@dataclass
class VideoResponse:
    """Response from video generation API"""
    video_url: str
    video_id: str
    duration: int
    resolution: str
    status: str
    created_at: str
    expires_at: Optional[str] = None


class VideoGenerator:
    """Video generator class using OpenAI Sora and alternative APIs"""

    # Provider endpoints
    PROVIDERS = {
        "openai_sora": {
            "endpoint": "https://api.openai.com/v1/videos/generations",
            "auth_header": "Authorization",
            "auth_prefix": "Bearer",
            "status": "restricted_access"
        },
        "runway_gen2": {
            "endpoint": "https://api.runwayml.com/v1/generate",
            "auth_header": "Authorization",
            "auth_prefix": "Bearer",
            "status": "available"
        },
        "stability_video": {
            "endpoint": "https://api.stability.ai/v2beta/video/generate",
            "auth_header": "Authorization",
            "auth_prefix": "Bearer",
            "status": "available"
        }
    }

    def __init__(self, api_key: Optional[str] = None, model: str = "openai_sora"):
        """
        Initialize video generator

        Args:
            api_key: OpenAI or provider API key
            model: Video generation model to use
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.model = model
        self.provider_config = self.PROVIDERS.get(model, self.PROVIDERS["openai_sora"])

    def _make_request(self, url: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Make HTTP request to video generation API"""
        headers = {
            "Content-Type": "application/json",
            self.provider_config["auth_header"]: f"{self.provider_config['auth_prefix']} {self.api_key}"
        }

        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()

    def generate(self, request: VideoGenerationRequest) -> VideoResponse:
        """
        Generate video from prompt

        Args:
            request: VideoGenerationRequest with parameters

        Returns:
            VideoResponse with video URL and metadata

        Raises:
            ValueError: If request is invalid
            requests.HTTPError: If API request fails
        """
        if not request.prompt:
            raise ValueError("Prompt is required")

        # Validate model availability
        if self.provider_config["status"] == "restricted_access" and not self._has_sora_access():
            raise ValueError(f"Model '{request.model}' requires restricted access to Sora API")

        # Build request payload
        payload = {
            "model": request.model,
            "prompt": request.prompt,
            "duration": request.duration,
            "resolution": request.resolution,
            "aspect_ratio": request.aspect_ratio
        }

        # Optional parameters
        if request.style:
            payload["style"] = request.style
        if request.negative_prompt:
            payload["negative_prompt"] = request.negative_prompt

        # Make API request
        response_data = self._make_request(self.provider_config["endpoint"], payload)

        # Parse response
        return VideoResponse(
            video_url=response_data.get("video_url"),
            video_id=response_data.get("video_id"),
            duration=response_data.get("duration", request.duration),
            resolution=response_data.get("resolution", request.resolution),
            status=response_data.get("status", "completed"),
            created_at=response_data.get("created_at", time.strftime("%Y-%m-%dT%H:%M:%SZ")),
            expires_at=response_data.get("expires_at")
        )

    def _has_sora_access(self) -> bool:
        """Check if environment has access to Sora (restricted)"""
        # TODO: Implement access check when Sora API is public
        return bool(self.api_key and os.getenv("SORA_ACCESS_ENABLED", "").lower() == "true")

    def download_video(self, video_url: str, output_path: str) -> str:
        """
        Download video from URL to local file

        Args:
            video_url: URL of generated video
            output_path: Local path to save video

        Returns:
            Local file path of downloaded video
        """
        response = requests.get(video_url, stream=True)
        response.raise_for_status()

        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        return output_path


def generate_video_prompt(scene: str, style: str = "cinematic") -> str:
    """
    Helper: Generate enhanced video prompt from scene description

    Args:
        scene: Basic scene description
        style: Video style (cinematic, documentary, animation, etc.)

    Returns:
        Enhanced prompt with visual details
    """
    style_modifiers = {
        "cinematic": "Cinematic shot, golden hour lighting, 4K quality, smooth camera movement",
        "documentary": "Documentary style, natural lighting, handheld camera, authentic feel",
        "animation": "3D animated style, vibrant colors, expressive character animation",
        "commercial": "Commercial style, bright lighting, product-focused, smooth transitions"
    }

    modifier = style_modifiers.get(style, style_modifiers["cinematic"])
    return f"{scene}. {modifier}"


# ============================================================================
# USAGE EXAMPLE
# ============================================================================

if __name__ == "__main__":
    # Example: Generate video (requires API key and access)
    generator = VideoGenerator(
        api_key=os.getenv("OPENAI_API_KEY"),
        model="openai_sora"
    )

    # Create request
    request = VideoGenerationRequest(
        prompt=generate_video_prompt(
            "A modern barber shop in São Paulo, Brazil, with golden lights, barber cutting hair",
            style="cinematic"
        ),
        duration=15,
        resolution="1080p",
        aspect_ratio="16:9"
    )

    try:
        # Generate video
        response = generator.generate(request)
        print(f"✅ Video generated: {response.video_url}")
        print(f"📹 Duration: {response.duration}s, Resolution: {response.resolution}")

        # Download video (optional)
        # local_path = generator.download_video(response.video_url, "/tmp/barberzap_video.mp4")
        # print(f"💾 Downloaded: {local_path}")

    except Exception as e:
        print(f"❌ Error generating video: {e}")
