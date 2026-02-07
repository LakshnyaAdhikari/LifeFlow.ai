"""
LLM Client Service

Handles all interactions with LLM providers (OpenAI, Gemini)
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel
import os
import json
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential


class LLMConfig(BaseModel):
    """LLM configuration"""
    provider: str = "gemini"  # "openai" or "gemini"
    model: str = "models/gemini-2.5-flash-lite"  # Verified fast & available
    temperature: float = 0.7
    max_tokens: int = 1500
    api_key: Optional[str] = None


class LLMResponse(BaseModel):
    """LLM response with metadata"""
    content: str
    model: str
    tokens_used: int
    confidence: Optional[float] = None  # Model-derived confidence


class LLMClient:
    """
    Unified LLM client supporting multiple providers (OpenAI, Gemini)
    """
    
    def __init__(self, config: Optional[LLMConfig] = None, provider: Optional[str] = None):
        # Get provider from arg, config, or environment
        if provider:
            self.provider = provider
        elif config:
            self.provider = config.provider
        else:
            self.provider = os.getenv("LLM_PROVIDER", "local").lower() # Default to local if not set
        
        if config is None:
            config = LLMConfig(provider=self.provider)
        
        self.config = config
        
        # Initialize the appropriate client
        if self.provider == "openai":
            self._init_openai()
        elif self.provider == "gemini":
            self._init_gemini()
        elif self.provider == "local":
            self._init_local()
        else:
            logger.warning(f"Unsupported LLM provider: {self.provider}, defaulting to local")
            self.provider = "local"
            self._init_local()
        
        logger.info(f"Initialized LLM client with provider: {self.provider}")

    def _init_local(self):
        """Initialize local embedding model"""
        try:
            from sentence_transformers import SentenceTransformer
            self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("Initialized local embedding model: all-MiniLM-L6-v2")
        except ImportError:
            raise ImportError("sentence-transformers not installed. Run: pip install sentence-transformers")
    
    def _init_openai(self):
        """Initialize OpenAI client"""
        try:
            from openai import AsyncOpenAI
        except ImportError:
            raise ImportError("OpenAI package not installed. Run: pip install openai")
        
        api_key = self.config.api_key or os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OpenAI API key not found. Set OPENAI_API_KEY environment variable.")
        
        self.client = AsyncOpenAI(api_key=api_key)
        if self.config.model == "gemini-1.5-pro":  # Default was set for Gemini
            self.config.model = "gpt-4-turbo-preview"
    
    def _init_gemini(self):
        """Initialize Gemini client"""
        try:
            from google import genai
        except ImportError:
            raise ImportError("Google GenAI package not installed. Run: pip install google-genai")
        
        api_key = self.config.api_key or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("Gemini API key not found. Set GEMINI_API_KEY environment variable.")
        
        self.client = genai.Client(api_key=api_key)
        if self.config.model == "gpt-4-turbo-preview":  # Default was set for OpenAI
            self.config.model = "models/gemini-2.5-flash-lite"  # Use verified available model
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        response_format: Optional[Dict[str, Any]] = None
    ) -> LLMResponse:
        """
        Generate completion from LLM
        
        Args:
            prompt: User/assistant prompt
            system_prompt: System instructions
            temperature: Override default temperature
            max_tokens: Override default max tokens
            response_format: Optional JSON schema for structured output
        """
        if self.provider == "openai":
            return await self._generate_openai(prompt, system_prompt, temperature, max_tokens, response_format)
        elif self.provider == "gemini":
            return await self._generate_gemini(prompt, system_prompt, temperature, max_tokens, response_format)
    
    async def _generate_openai(
        self,
        prompt: str,
        system_prompt: Optional[str],
        temperature: Optional[float],
        max_tokens: Optional[int],
        response_format: Optional[Dict[str, Any]]
    ) -> LLMResponse:
        """Generate using OpenAI"""
        messages = []
        
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        messages.append({"role": "user", "content": prompt})
        
        try:
            kwargs = {
                "model": self.config.model,
                "messages": messages,
                "temperature": temperature or self.config.temperature,
                "max_tokens": max_tokens or self.config.max_tokens,
            }
            
            if response_format:
                kwargs["response_format"] = response_format
            
            response = await self.client.chat.completions.create(**kwargs)
            
            content = response.choices[0].message.content
            tokens_used = response.usage.total_tokens
            
            logger.info(f"OpenAI generation successful. Tokens used: {tokens_used}")
            
            return LLMResponse(
                content=content,
                model=self.config.model,
                tokens_used=tokens_used,
                confidence=None
            )
        
        except Exception as e:
            logger.error(f"OpenAI generation failed: {e}")
            raise
    
    async def _generate_gemini(
        self,
        prompt: str,
        system_prompt: Optional[str],
        temperature: Optional[float],
        max_tokens: Optional[int],
        response_format: Optional[Dict[str, Any]]
    ) -> LLMResponse:
        """Generate using Gemini with new google.genai API"""
        try:
            # Combine system prompt and user prompt
            full_prompt = prompt
            if system_prompt:
                full_prompt = f"{system_prompt}\n\n{prompt}"
            
            # Add JSON instruction if response_format is specified
            if response_format:
                full_prompt += "\n\nRespond with valid JSON only."
            
            import time
            start = time.time()
            logger.info(f"⚡ Generating content with model: {self.config.model}")
            
            # Generate content using new API
            response = self.client.models.generate_content(
                model=self.config.model,
                contents=full_prompt,
                config={
                    "temperature": temperature or self.config.temperature,
                    "max_output_tokens": max_tokens or self.config.max_tokens,
                }
            )
            
            duration = time.time() - start
            logger.info(f"✅ Gemini generation complete in {duration:.2f}s")
            
            content = response.text
            
            # Estimate tokens (free tier doesn't provide exact count)
            tokens_used = len(full_prompt.split()) + len(content.split())
            
            return LLMResponse(
                content=content,
                model=self.config.model,
                tokens_used=tokens_used,
                confidence=None
            )
        
        except Exception as e:
            logger.error(f"Gemini generation failed: {e}")
            raise
    
    async def generate_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Generate JSON response from LLM
        """
        response = await self.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=temperature,
            response_format={"type": "json_object"} if self.provider == "openai" else None
        )
        
        try:
            return json.loads(response.content)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.error(f"Response content: {response.content}")
            raise
    
    async def generate_embedding(
        self,
        text: str,
        model: Optional[str] = None
    ) -> List[float]:
        """
        Generate embedding vector for text
        """
        if self.provider == "openai":
            return await self._generate_embedding_openai(text, model or "text-embedding-3-large")
        elif self.provider == "gemini":
            # Fallback to local since models/embedding-001 is unstable/404
            if not hasattr(self, 'embedding_model'):
                self._init_local()
            return self._generate_embedding_local(text)
        elif self.provider == "local":
            return self._generate_embedding_local(text)

    def _generate_embedding_local(self, text: str) -> List[float]:
        """Generate embedding using local model"""
        try:
            embedding = self.embedding_model.encode(text)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Local embedding generation failed: {e}")
            raise

    
    async def _generate_embedding_openai(self, text: str, model: str) -> List[float]:
        """Generate embedding using OpenAI"""
        try:
            response = await self.client.embeddings.create(
                model=model,
                input=text
            )
            
            embedding = response.data[0].embedding
            logger.debug(f"Generated OpenAI embedding with {len(embedding)} dimensions")
            
            return embedding
        
        except Exception as e:
            logger.error(f"OpenAI embedding generation failed: {e}")
            raise
    
    async def _generate_embedding_gemini(self, text: str, model: str) -> List[float]:
        """Generate embedding using Gemini"""
        try:
            result = self.client.models.embed_content(
                model=model,
                contents=text,
                config={"task_type": "retrieval_document"}
            )
            
            embedding = result.embeddings[0].values
            logger.debug(f"Generated Gemini embedding with {len(embedding)} dimensions")
            
            return embedding
        
        except Exception as e:
            logger.error(f"Gemini embedding generation failed: {e}")
            raise

    async def generate_embeddings_batch(
        self,
        texts: List[str],
        model: Optional[str] = None,
        batch_size: int = 100
    ) -> List[List[float]]:
        """
        Generate embeddings for multiple texts in batches
        """
        if self.provider == "openai":
            return await self._generate_embeddings_batch_openai(texts, model or "text-embedding-3-large", batch_size)
        elif self.provider == "gemini":
            # Fallback to local since models/embedding-001 is unstable/404
            if not hasattr(self, 'embedding_model'):
                self._init_local()
            return self._generate_embeddings_batch_local(texts, batch_size)
        elif self.provider == "local":
            return self._generate_embeddings_batch_local(texts, batch_size)

    def _generate_embeddings_batch_local(self, texts: List[str], batch_size: int) -> List[List[float]]:
        """Generate embeddings batch using local model"""
        embeddings = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            try:
                batch_embeddings = self.embedding_model.encode(batch)
                embeddings.extend(batch_embeddings.tolist())
                logger.info(f"Generated local embeddings for batch {i//batch_size + 1}/{(len(texts)-1)//batch_size + 1}")
            except Exception as e:
                logger.error(f"Local batch embedding generation failed: {e}")
                raise
        return embeddings

    async def _generate_embeddings_batch_openai(self, texts: List[str], model: str, batch_size: int) -> List[List[float]]:
        """Generate embeddings batch using OpenAI"""
        embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            
            try:
                response = await self.client.embeddings.create(
                    model=model,
                    input=batch
                )
                
                batch_embeddings = [d.embedding for d in response.data]
                embeddings.extend(batch_embeddings)
                
                logger.info(f"Generated OpenAI embeddings for batch {i//batch_size + 1}/{(len(texts)-1)//batch_size + 1}")
            
            except Exception as e:
                logger.error(f"OpenAI batch embedding generation failed: {e}")
                raise
        
        return embeddings

    async def _generate_embeddings_batch_gemini(self, texts: List[str], model: str, batch_size: int) -> List[List[float]]:
        """Generate embeddings batch using Gemini"""
        embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            
            try:
                # Gemini supports batch embedding
                result = self.client.models.embed_content(
                    model=model,
                    contents=batch,
                    config={"task_type": "retrieval_document"}
                )
                
                # Extract embeddings from response object
                batch_embeddings = [e.values for e in result.embeddings]
                embeddings.extend(batch_embeddings)
                
                logger.info(f"Generated Gemini embeddings for batch {i//batch_size + 1}/{(len(texts)-1)//batch_size + 1}")
            
            except Exception as e:
                logger.error(f"Gemini batch embedding generation failed: {e}")
                raise
        
        return embeddings


# Global LLM client instance
_llm_client: Optional[LLMClient] = None


def get_llm_client() -> LLMClient:
    """Get singleton LLM client"""
    global _llm_client
    if not _llm_client:
        _llm_client = LLMClient(provider="gemini")
    return _llm_client
