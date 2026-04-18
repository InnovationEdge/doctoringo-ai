# RAG System Implementation Plan for Georgian Legal Documents

## Overview
Implement Retrieval-Augmented Generation (RAG) system to answer legal questions based on official Georgian legal documents from matsne.gov.ge instead of relying solely on LLM's general knowledge.

## Architecture

```
User Question
     ↓
1. Question Analysis & Keywords Extraction
     ↓
2. Search matsne.gov.ge for Relevant Documents
     ↓
3. Retrieve & Parse Document Content
     ↓
4. Generate Embeddings & Store in Vector DB
     ↓
5. Find Similar Sections (Vector Search)
     ↓
6. Pass Context + Question to GPT
     ↓
7. Generate Answer with Citations
     ↓
User Response with Source References
```

## Components

### 1. Matsne.gov.ge Scraper
**Purpose:** Fetch and parse legal documents from matsne.gov.ge

**Implementation:**
- Python scraper using `requests` + `BeautifulSoup`
- Selenium for JavaScript-heavy pages
- Rate limiting to avoid overloading server
- Cache documents locally

**Key Features:**
- Search by keywords
- Download document content
- Extract metadata (title, date, document number, issuer)
- Handle Georgian text encoding

### 2. Document Processor
**Purpose:** Clean and structure scraped documents

**Tasks:**
- Remove HTML tags
- Extract meaningful text
- Split into chunks (paragraphs/sections)
- Preserve structure (articles, clauses)
- Handle Georgian language specifics

### 3. Vector Database
**Purpose:** Store document embeddings for similarity search

**Options:**
- **Pinecone** (managed, easy)
- **Chroma** (open-source, local)
- **Weaviate** (open-source, scalable)
- **Qdrant** (open-source, fast)

**Recommended:** ChromaDB (easy to start, can migrate later)

**Storage:**
```python
{
  "id": "unique_chunk_id",
  "document_id": "matsne_doc_123",
  "document_title": "სამოქალაქო კოდექსი",
  "document_url": "https://matsne.gov.ge/...",
  "chunk_text": "მუხლი 1. ...",
  "metadata": {
    "article": "1",
    "section": "2",
    "date": "2023-01-01"
  },
  "embedding": [0.1, 0.2, ...] // 1536 dimensions for OpenAI
}
```

### 4. Embedding Generator
**Purpose:** Convert text to vector embeddings

**Options:**
- **OpenAI Embeddings** (text-embedding-ada-002) - $0.0001/1K tokens
- **Cohere Embeddings** - Multilingual support
- **Sentence Transformers** - Free, local

**Recommended:** OpenAI for consistency with GPT-5

### 5. RAG Query Engine
**Purpose:** Process user questions and retrieve relevant context

**Flow:**
```python
1. User asks: "რა არის ხელშეკრულების გაუქმების პირობები?"
2. Generate query embedding
3. Search vector DB for similar chunks (top 5-10)
4. Retrieve matched document sections
5. Format context for GPT
6. Add to system prompt
7. Generate answer with citations
```

### 6. Citation Generator
**Purpose:** Add source references to answers

**Format:**
```markdown
პასუხი: ხელშეკრულება შეიძლება გაუქმდეს...

**წყაროები:**
- სამოქალაქო კოდექსი, მუხლი 390
  https://matsne.gov.ge/ka/document/view/31702
- ვალდებულებითი სამართლის კოდექსი, მუხლი 15
  https://matsne.gov.ge/ka/document/view/123456
```

## Backend Implementation

### File Structure:
```
backend/
├── rag/
│   ├── __init__.py
│   ├── scraper.py          # Matsne scraper
│   ├── processor.py        # Document processing
│   ├── embeddings.py       # Embedding generation
│   ├── vector_store.py     # Vector DB interface
│   ├── retriever.py        # RAG retrieval logic
│   ├── models.py           # DB models
│   └── tasks.py            # Celery tasks (async)
├── requirements.txt
└── config/settings.py
```

### New Dependencies:
```txt
# Scraping
beautifulsoup4==4.12.2
selenium==4.15.0
requests==2.31.0

# Vector DB
chromadb==0.4.18

# Embeddings
openai>=1.0.0  # Already have

# Document Processing
langchain==0.1.0
tiktoken>=0.5.0  # Already have

# Celery (async tasks)
celery==5.3.4
redis==5.0.1

# Georgian language support
langdetect==1.0.9
```

### Database Models:

```python
# rag/models.py
from django.db import models

class LegalDocument(models.Model):
    """Store matsne.gov.ge documents"""
    document_id = models.CharField(max_length=100, unique=True)
    title = models.CharField(max_length=500)
    url = models.URLField()
    document_type = models.CharField(max_length=100)  # Law, Code, Regulation
    issuer = models.CharField(max_length=200)
    issue_date = models.DateField(null=True)
    full_text = models.TextField()
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['document_id']),
            models.Index(fields=['document_type']),
        ]

class DocumentChunk(models.Model):
    """Store document chunks for RAG"""
    document = models.ForeignKey(LegalDocument, on_delete=models.CASCADE)
    chunk_id = models.CharField(max_length=200, unique=True)
    chunk_text = models.TextField()
    chunk_index = models.IntegerField()
    article_number = models.CharField(max_length=50, null=True)
    section_number = models.CharField(max_length=50, null=True)
    metadata = models.JSONField(default=dict)
    vector_id = models.CharField(max_length=200)  # ID in vector DB
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['document', 'chunk_index']),
        ]

class RAGQuery(models.Model):
    """Track RAG queries for analytics"""
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    question = models.TextField()
    retrieved_chunks = models.JSONField()  # IDs of chunks used
    answer = models.TextField()
    sources_cited = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
```

### Scraper Implementation:

```python
# rag/scraper.py
import requests
from bs4 import BeautifulSoup
import time
from typing import List, Dict

class MatsneScraper:
    BASE_URL = "https://matsne.gov.ge"

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'KnowHow AI Legal Assistant Bot'
        })

    def search_documents(self, query: str, doc_type: str = None) -> List[Dict]:
        """
        Search for documents on matsne.gov.ge

        Args:
            query: Search keywords in Georgian
            doc_type: Filter by document type

        Returns:
            List of document metadata
        """
        # Implementation depends on matsne.gov.ge API/structure
        # This is a placeholder
        search_url = f"{self.BASE_URL}/ka/search"
        params = {
            'q': query,
            'type': doc_type
        }

        response = self.session.get(search_url, params=params)
        soup = BeautifulSoup(response.content, 'html.parser')

        documents = []
        # Parse search results
        # Extract: title, URL, document ID, date, etc.

        return documents

    def fetch_document(self, document_id: str) -> Dict:
        """
        Fetch full document content

        Args:
            document_id: Matsne document ID

        Returns:
            Document data with full text
        """
        doc_url = f"{self.BASE_URL}/ka/document/view/{document_id}"
        response = self.session.get(doc_url)
        soup = BeautifulSoup(response.content, 'html.parser')

        # Extract document content
        title = soup.find('h1').text.strip()
        content = soup.find('div', class_='document-content').text

        # Extract metadata
        metadata = self._extract_metadata(soup)

        return {
            'document_id': document_id,
            'title': title,
            'url': doc_url,
            'full_text': content,
            'metadata': metadata
        }

    def _extract_metadata(self, soup: BeautifulSoup) -> Dict:
        """Extract document metadata"""
        # Implementation depends on page structure
        return {}

    def rate_limit(self, seconds: int = 1):
        """Respect server load"""
        time.sleep(seconds)
```

### RAG Retriever:

```python
# rag/retriever.py
from typing import List, Dict
import openai
from .vector_store import VectorStore
from .models import DocumentChunk

class RAGRetriever:
    def __init__(self):
        self.vector_store = VectorStore()
        self.openai = openai

    async def retrieve_context(self, question: str, top_k: int = 5) -> List[Dict]:
        """
        Retrieve relevant document chunks for a question

        Args:
            question: User's legal question
            top_k: Number of chunks to retrieve

        Returns:
            List of relevant chunks with metadata
        """
        # Generate embedding for question
        question_embedding = await self._generate_embedding(question)

        # Search vector database
        results = self.vector_store.similarity_search(
            question_embedding,
            top_k=top_k
        )

        # Fetch full chunk data from DB
        chunks = []
        for result in results:
            chunk = DocumentChunk.objects.get(vector_id=result['id'])
            chunks.append({
                'text': chunk.chunk_text,
                'document_title': chunk.document.title,
                'document_url': chunk.document.url,
                'article': chunk.article_number,
                'section': chunk.section_number,
                'similarity_score': result['score']
            })

        return chunks

    async def _generate_embedding(self, text: str):
        """Generate embedding using OpenAI"""
        response = await self.openai.Embedding.create(
            input=text,
            model="text-embedding-ada-002"
        )
        return response['data'][0]['embedding']

    def format_context_for_gpt(self, chunks: List[Dict]) -> str:
        """Format retrieved chunks for GPT prompt"""
        context = "ოფიციალური სამართლებრივი დოკუმენტები:\n\n"

        for i, chunk in enumerate(chunks, 1):
            context += f"წყარო {i}:\n"
            context += f"დოკუმენტი: {chunk['document_title']}\n"
            if chunk['article']:
                context += f"მუხლი: {chunk['article']}\n"
            context += f"ტექსტი: {chunk['text']}\n"
            context += f"URL: {chunk['document_url']}\n\n"

        return context
```

### Chat Integration:

```python
# Modify chat/views.py
from rag.retriever import RAGRetriever

class ChatView:
    def __init__(self):
        self.rag_retriever = RAGRetriever()

    async def generate_response(self, user_message: str):
        # Check if question is legal-related
        if self._is_legal_question(user_message):
            # Retrieve relevant legal documents
            relevant_chunks = await self.rag_retriever.retrieve_context(
                user_message,
                top_k=5
            )

            # Format context
            context = self.rag_retriever.format_context_for_gpt(relevant_chunks)

            # Enhanced system prompt
            system_prompt = f"""
            თქვენ ხართ სამართლებრივი ასისტენტი.

            გამოიყენეთ მხოლოდ შემდეგი ოფიციალური დოკუმენტები პასუხის გასაცემად:

            {context}

            მოყვეთ კონკრეტული წყაროები და მუხლები თქვენს პასუხში.
            თუ დოკუმენტებში არ არის საკმარისი ინფორმაცია, აცნობეთ მომხმარებელს.
            """

            # Generate response with context
            response = await self.gpt_generate(
                system_prompt=system_prompt,
                user_message=user_message
            )

            # Add citations
            response_with_citations = self._add_citations(
                response,
                relevant_chunks
            )

            return response_with_citations
        else:
            # Regular chat without RAG
            return await self.gpt_generate(user_message=user_message)

    def _is_legal_question(self, message: str) -> bool:
        """Detect if question is legal-related"""
        legal_keywords = [
            'კანონი', 'კოდექსი', 'მუხლი', 'სამართალი',
            'ხელშეკრულება', 'ვალდებულება', 'უფლება'
        ]
        return any(keyword in message for keyword in legal_keywords)

    def _add_citations(self, response: str, chunks: List[Dict]) -> str:
        """Add source citations to response"""
        citations = "\n\n**წყაროები:**\n"
        for chunk in chunks:
            citations += f"- {chunk['document_title']}"
            if chunk['article']:
                citations += f", მუხლი {chunk['article']}"
            citations += f"\n  {chunk['document_url']}\n"

        return response + citations
```

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- [ ] Set up ChromaDB
- [ ] Create database models
- [ ] Implement basic scraper
- [ ] Test document fetching

### Phase 2: Document Processing (Week 2)
- [ ] Implement text processor
- [ ] Create chunking logic
- [ ] Generate embeddings
- [ ] Store in vector DB

### Phase 3: RAG Integration (Week 3)
- [ ] Implement retriever
- [ ] Integrate with chat API
- [ ] Add citation generation
- [ ] Test end-to-end

### Phase 4: Optimization (Week 4)
- [ ] Add caching
- [ ] Optimize search
- [ ] Improve chunking
- [ ] Add analytics

## Testing Strategy

### Unit Tests:
- Scraper fetches correct documents
- Processor chunks text correctly
- Embeddings generated properly
- Retriever finds relevant chunks

### Integration Tests:
- End-to-end question answering
- Citation accuracy
- Performance benchmarks

### Example Test Cases:
```python
def test_rag_contract_question():
    question = "რა არის ხელშეკრულების გაუქმების პირობები?"
    response = rag_system.answer(question)

    assert "სამოქალაქო კოდექსი" in response
    assert "მუხლი" in response
    assert "matsne.gov.ge" in response
```

## Cost Estimation

### OpenAI Costs:
- Embeddings: $0.0001 per 1K tokens
- For 10,000 document chunks: ~$50-100
- Ongoing: $10-20/month for new queries

### Infrastructure:
- ChromaDB: Free (self-hosted)
- Storage: ~10GB for documents
- Redis: Free tier or $5/month

### Total Monthly Cost: ~$15-30

## Success Metrics

1. **Accuracy:** 90%+ answers cite correct legal sources
2. **Relevance:** Top 3 retrieved chunks contain answer
3. **Speed:** < 2 seconds for retrieval
4. **Coverage:** 1000+ legal documents indexed
5. **User Satisfaction:** Users prefer RAG answers

## Next Steps

1. ✅ Create this implementation plan
2. ⏳ Set up vector database (ChromaDB)
3. ⏳ Build matsne.gov.ge scraper
4. ⏳ Implement document processor
5. ⏳ Integrate with chat API
6. ⏳ Deploy and test

## Security & Legal Considerations

### matsne.gov.ge Terms:
- Check robots.txt
- Respect rate limits
- Attribute sources properly
- Don't redistribute documents

### Privacy:
- Don't store user queries with PII
- Anonymize analytics data
- Secure vector database access

### Liability:
- Add disclaimer: "AI-generated, verify with lawyer"
- Cite all sources
- Update documents regularly

---

**Ready to implement? Let's start with the scraper and vector database setup!**
