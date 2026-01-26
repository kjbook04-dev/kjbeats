# YouTube API Setup Instructions

## Step 1: Go to Google Cloud Console
Visit: https://console.developers.google.com/

## Step 2: Create or Select Project
- Click "Select a project" → "New Project"
- Name it "Music Website" → Create

## Step 3: Enable YouTube Data API
- Go to "APIs & Services" → "Library"
- Search "YouTube Data API v3"
- Click it → Enable

## Step 4: Create Credentials
- Go to "APIs & Services" → "Credentials"
- Click "Create Credentials" → "API Key"
- Copy the API key

## Step 5: Add to Environment File
- Create .env.local file in your project root
- Add: YOUTUBE_API_KEY=your_api_key_here
- Restart your development server

## What You'll Get:
✅ Access to millions of YouTube videos
✅ Real search results
✅ Latest uploads and covers
❌ Geo-restrictions still apply
❌ Major label blocks still exist

## Cost:
- Free tier: 10,000 requests/day
- Each search = ~3 requests
- ~3,000 searches/day for free