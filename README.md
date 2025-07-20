# SaaS Chatbot Platform

A comprehensive multi-tenant SaaS platform for deploying AI-powered chatbots with RAG (Retrieval-Augmented Generation) capabilities.

## Features

### 🏢 Multi-Tenant Architecture
- **Admin Portal**: Manage all tenants, view analytics, configure global settings
- **Client Portal**: Individual dashboards for each tenant with full customization
- **Isolated Data**: Each tenant's data is completely separated and secure

### 🤖 AI-Powered Chatbots
- **RAG Integration**: Upload documents (PDF, TXT, CSV) for contextual responses
- **Vector Search**: ChromaDB for efficient document retrieval
- **Streaming Responses**: Real-time chat experience with Together.ai API
- **Customizable**: Brand colors, welcome messages, bot names

### 📊 Analytics & Management
- **Chat Logs**: Track all conversations with RAG usage indicators
- **Document Management**: Upload, process, and manage knowledge base files
- **Usage Analytics**: Monitor chat volume, document usage, and performance
- **Token Management**: Secure API tokens with regeneration capabilities

### 🎨 Professional UI
- **Tailwind CSS**: Modern, responsive design
- **Drag & Drop**: Intuitive file upload interface
- **Real-time Updates**: Live progress indicators and notifications
- **Mobile Friendly**: Optimized for all device sizes

## Quick Start

### Prerequisites

1. **Node.js 18+** and **pnpm**
2. **MongoDB** (local or cloud)
3. **ChromaDB** server
4. **Together.ai API key**

### Installation

1. **Clone and install dependencies:**
\`\`\`bash
git clone <repository-url>
cd saas-chatbot-platform
pnpm install
\`\`\`

2. **Set up environment variables:**
\`\`\`bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# See SECURITY.md for detailed setup instructions
TOGETHER_API_KEY=your_together_api_key_here
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=your_jwt_secret_here
EMBED_JWT_SECRET=your_embed_jwt_secret_here
NEXTAUTH_URL=http://localhost:3000
```

⚠️ **Security Notice**: Never commit real credentials. See `SECURITY.md` for detailed security guidelines.
\`\`\`

Edit `.env.local` with your configuration:
\`\`\`env
TOGETHER_API_KEY=your_together_api_key_here
MONGODB_URI=mongodb://localhost:27017/chatbot_saas
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
JWT_SECRET=your_jwt_secret_here
CHROMA_HOST=localhost
CHROMA_PORT=8000
\`\`\`

3. **Start MongoDB:**
\`\`\`bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or install locally
# macOS: brew install mongodb-community
# Ubuntu: sudo apt install mongodb
\`\`\`

4. **Start ChromaDB:**
\`\`\`bash
# Using Docker
docker run -d -p 8000:8000 --name chromadb chromadb/chroma:latest

# Or using Python
pip install chromadb
chroma run --host localhost --port 8000
\`\`\`

5. **Run the application:**
\`\`\`bash
pnpm dev
\`\`\`

Visit `http://localhost:3000` to access the platform.

## Usage Guide

### Admin Portal (`/admin`)
- **Login**: Use credentials from `.env` (default: admin/admin123)
- **Tenant Management**: Create, suspend, or delete client accounts
- **Global Settings**: Configure platform-wide defaults
- **Analytics**: View usage statistics across all tenants

### Client Portal (`/client`)
- **Login**: Use tenant credentials (demo: any email/password)
- **Knowledge Base**: Upload and manage documents
- **Customization**: Configure chatbot appearance and behavior
- **Embed Code**: Get script tag for website integration
- **Analytics**: View chat logs and usage statistics

### Embedding Chatbots

Add this script to any website:
\`\`\`html
<script src="https://yourdomain.com/embed.js?token=YOUR_API_TOKEN" defer></script>
\`\`\`

The chatbot will appear as a floating button in the bottom-right corner.

## Architecture

### Tech Stack
- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB (tenant data, documents, logs)
- **Vector DB**: ChromaDB (document embeddings)
- **AI**: Together.ai API (LLM responses)
- **Auth**: JWT tokens, bcrypt hashing

### File Structure
\`\`\`
├── app/
│   ├── admin/           # Admin portal pages
│   ├── client/          # Client portal pages
│   ├── api/             # API routes
│   │   ├── chat/        # Chat endpoint
│   │   ├── upload/      # File upload
│   │   ├── tenants/     # Tenant management
│   │   └── embed/       # Widget script
│   └── embed/           # Embeddable widget
├── lib/
│   ├── mongodb.ts       # Database connection
│   ├── auth.ts          # Authentication utilities
│   ├── rag.ts           # RAG/vector operations
│   └── file-parser.ts   # Document processing
├── components/ui/       # Reusable UI components
└── uploads/             # File storage (per tenant)
\`\`\`

### Data Flow
1. **Document Upload**: Files → Parser → Chunks → ChromaDB + MongoDB
2. **Chat Request**: User message → RAG search → LLM + context → Streamed response
3. **Widget Integration**: Script tag → API token → Tenant config → Chat interface

## Development

### Adding New File Types
Extend `lib/file-parser.ts`:
\`\`\`typescript
case '.docx':
  return parseDocx(filePath, filename)
\`\`\`

### Custom AI Models
Modify `app/api/chat/route.ts`:
\`\`\`typescript
const result = streamText({
  model: openai('gpt-4-turbo'), // Change model here
  // ... other options
})
\`\`\`

### Database Schema

**Tenants Collection:**
\`\`\`javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String, // hashed
  apiToken: String,
  status: 'active' | 'suspended',
  ragEnabled: Boolean,
  config: {
    botName: String,
    welcomeMessage: String,
    primaryColor: String
  },
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

**Documents Collection:**
\`\`\`javascript
{
  _id: ObjectId,
  tenantId: String,
  filename: String,
  filePath: String,
  size: Number,
  type: String,
  status: 'processing' | 'ready' | 'error',
  uploadedAt: Date,
  chunkCount: Number
}
\`\`\`

## Deployment

### Production Setup
1. **Environment**: Set production environment variables
2. **Database**: Use MongoDB Atlas or dedicated server
3. **Vector DB**: Deploy ChromaDB with persistent storage
4. **CDN**: Configure for static assets and uploads
5. **SSL**: Enable HTTPS for secure widget embedding

### Scaling Considerations
- **Load Balancing**: Multiple Next.js instances
- **Database Sharding**: Partition by tenant
- **Caching**: Redis for session and response caching
- **File Storage**: S3 or similar for document uploads

## Security

- **JWT Authentication**: Secure token-based auth
- **Input Validation**: All user inputs sanitized
- **File Upload Limits**: Size and type restrictions
- **Rate Limiting**: Prevent API abuse
- **CORS Configuration**: Secure cross-origin requests

## Support

For issues and questions:
1. Check the troubleshooting section below
2. Review API documentation
3. Open an issue on GitHub

### Troubleshooting

**MongoDB Connection Issues:**
\`\`\`bash
# Check if MongoDB is running
mongosh --eval "db.adminCommand('ismaster')"
\`\`\`

**ChromaDB Connection Issues:**
\`\`\`bash
# Test ChromaDB endpoint
curl http://localhost:8000/api/v1/heartbeat
\`\`\`

**File Upload Errors:**
- Check file size limits in `.env`
- Verify upload directory permissions
- Ensure supported file types

## License

MIT License - see LICENSE file for details.
