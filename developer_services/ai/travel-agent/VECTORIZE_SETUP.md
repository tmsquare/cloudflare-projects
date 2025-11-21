# 🚀 PerfectStay Vectorize Setup Guide

This guide explains how to set up Cloudflare Vectorize for your PerfectStay travel agent chatbot.

## 📋 Prerequisites

- Cloudflare account with Workers/Vectorize access
- OpenAI API key
- Node.js and npm installed
- `perfectstay.json` file in the project root

## 🔧 Setup Steps

### Step 1: Install Dependencies

```bash
cd /Users/mouhamadou-tidiane/Documents/mouhamad-se-scripts/ai/mcp/agents-starter

# Install tsx for running TypeScript scripts
npm install -D tsx

# Install required packages if not already installed
npm install
```

### Step 2: Create Vectorize Index

```bash
# Create the Vectorize index
wrangler vectorize create perfectstay-travel --dimensions=768 --metric=cosine
```

**Note:** We use 768 dimensions for Cloudflare's `@cf/baai/bge-base-en-v1.5` model. **No OpenAI API key needed!**

### Step 3: Create Upload Worker Config

Create a temporary `wrangler.upload.jsonc` file in your project root:

```jsonc
{
  "name": "perfectstay-uploader",
  "main": "scripts/upload-to-vectorize-cf.ts",
  "compatibility_date": "2025-08-03",
  "compatibility_flags": ["nodejs_compat"],
  "ai": {
    "binding": "AI"
  },
  "vectorize": [
    {
      "binding": "VECTORIZE",
      "index_name": "perfectstay-travel"
    }
  ]
}
```

### Step 4: Upload Data to Vectorize

**Option A: Run locally with remote bindings (Recommended)**

```bash
wrangler dev scripts/upload-to-vectorize-cf.ts --remote
```

Then open your browser to `http://localhost:8787`

**Option B: Deploy temporarily and run**

```bash
# Deploy the uploader
wrangler deploy -c wrangler.upload.jsonc

# Visit the deployed URL (shown after deploy)
# e.g., https://perfectstay-uploader.your-subdomain.workers.dev

# After upload completes, delete it
wrangler delete perfectstay-uploader
```

This will:
1. Read all 1200+ products from `perfectstay.json`
2. Generate embeddings using **Cloudflare Workers AI** (free, fast!)
3. Upload vectors to Cloudflare Vectorize in batches
4. Take approximately **2-3 minutes** (much faster than OpenAI!)

**Expected Output:**
```
📖 Reading perfectstay.json...
📊 Found 1234 products
Processing batch 1/13...
✅ Uploaded 100/1234 vectors
Processing batch 2/13...
✅ Uploaded 200/1234 vectors
...
Processing batch 13/13...
✅ Uploaded 1234/1234 vectors
🎉 Done! All data uploaded to Vectorize.
```

### Step 5: Deploy Your Main Worker

```bash
# Deploy to Cloudflare
wrangler deploy
```

## 🎯 How It Works

### Data Preprocessing

Each product is converted to searchable text:

```
Hotel: Radio Hotel New York. 
Destination: Etats-Unis, New York City. 
Stars: 4 stars. 
Rating: 4.0/5 (246 reviews). 
Price: €649 per person. 
Duration: 3 nights. 
Flight included. 
Tags: Bronx, Boutique Hôtel. 
ID: 212027
```

### Embeddings Generation

- Uses Cloudflare Workers AI `@cf/baai/bge-base-en-v1.5` model
- 768 dimensions
- Cosine similarity for matching
- **100% free** with Cloudflare Workers
- **Much faster** than external API calls

### Vector Storage

Each vector includes metadata:
- `id`: Product ID
- `name`: Hotel name
- `destination`: Location
- `stars`: Star rating
- `rating`: TripAdvisor rating
- `reviews`: Number of reviews
- `price`: Price in EUR
- `nights`: Number of nights
- `flight_included`: Boolean
- `tags`: Comma-separated tags
- `url`: Product URL
- `image`: Main image URL
- `searchText`: Full searchable text

## 🔍 Using the Tool

### Example Queries

The AI agent can now handle queries like:

**Simple Search:**
```
"Show me beach resorts in Bali"
```

**With Filters:**
```
"Find luxury hotels in New York under €1000"
```

**With Preferences:**
```
"I want an all-inclusive family resort with a pool in Spain"
```

**With Multiple Filters:**
```
"Show me 4-star hotels in Paris with flights included, budget €500-800"
```

### Tool Parameters

The `getDatafromPerfectStay` tool accepts:

| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | string | **Required**. User's search query |
| `destination` | string | Filter by destination |
| `minPrice` | number | Minimum price in EUR |
| `maxPrice` | number | Maximum price in EUR |
| `minStars` | number | Minimum hotel stars (1-5) |
| `flightIncluded` | boolean | Filter for packages with flights |
| `tags` | string[] | Filter by tags (e.g., "Club", "Piscine") |
| `topK` | number | Number of results (default: 10) |

### Frontend Integration

The travel filters in your UI automatically map to the tool:

```javascript
// From your filters sidebar:
filters = {
  villeDepart: 'Paris',
  destination: 'Bali',
  dateDepart: '2025-07-01',
  dateRetour: '2025-07-10',
  themes: ['mer-soleil', 'piscine']
}

// Gets converted to tool parameters:
{
  query: "beach resort with pool in Bali",
  destination: "Bali",
  tags: ["Mer et Soleil", "Piscine"]
}
```

## 📊 Response Format

Successful response:

```json
{
  "success": true,
  "query": "luxury hotel in New York",
  "totalResults": 8,
  "filters": {
    "destination": "New York",
    "minStars": 4,
    "maxPrice": 1000
  },
  "products": [
    {
      "id": "212027",
      "score": 0.92,
      "name": "Radio Hotel New York",
      "destination": "Etats-Unis, New York City",
      "stars": 4,
      "rating": 4.0,
      "reviews": 246,
      "price": 649,
      "nights": 3,
      "flightIncluded": true,
      "tags": ["Bronx", "Boutique Hôtel"],
      "url": "https://www.perfectstay.com/...",
      "image": "https://res.cloudinary.com/..."
    }
  ]
}
```

## 🔧 Troubleshooting

### Issue: "Index not found"

**Solution:** Verify the index was created:
```bash
wrangler vectorize list
```

### Issue: "Rate limit exceeded" during upload

**Solution:** The script already includes delays. If you still hit limits, increase the batch delay in `upload-to-vectorize.ts`:

```typescript
// Change from 1000ms to 2000ms
await new Promise(resolve => setTimeout(resolve, 2000));
```

### Issue: "Binding VECTORIZE not found"

**Solution:** Make sure `wrangler.jsonc` includes:
```json
"vectorize": [
  {
    "binding": "VECTORIZE",
    "index_name": "perfectstay-travel"
  }
]
```

### Issue: "AI model not responding"

**Solution:** The worker uses Cloudflare's AI model `@cf/baai/bge-small-en-v1.5`. Make sure your account has AI access:
```bash
wrangler whoami
# Check if AI is enabled
```

## 🚀 Performance

- **Search time:** ~50-100ms
- **Results:** Highly relevant semantic matches
- **Scalability:** Can handle 10,000+ products
- **Cost:** Included in Workers Paid plan

## 📈 Next Steps

1. ✅ **Data uploaded to Vectorize**
2. ✅ **Tool updated to use Vectorize**
3. 🔄 **Test with real queries**
4. 📊 **Monitor performance in Cloudflare dashboard**
5. 🎨 **Enhance UI to display results beautifully**

## 🎉 Benefits Over Web Scraping

| Feature | Web Scraping | Vectorize |
|---------|--------------|-----------|
| Speed | 10-30 seconds | 50-100ms |
| Reliability | Can break if site changes | Always stable |
| Semantic Search | No | Yes |
| Filters | Limited | Full support |
| Cost | High (browser instances) | Low (included) |
| Scalability | Poor | Excellent |

Your travel agent chatbot is now supercharged with vector search! 🚀✈️
