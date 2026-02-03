"""
LLM Client Service

Handles all interactions with LLM providers (OpenAI, Claude)
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel
import os
from openai import AsyncOpenAI
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential


class LLMConfig(BaseModel):
    """LLM configuration"""
    provider: str = "openai"  # "openai" or "anthropic"
    model: str = "gpt-4-turbo-preview"
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
    Unified LLM client supporting multiple providers
    """
    
    def __init__(self, config: Optional[LLMConfig] = None):
        self.config = config or LLMConfig()
        
        # Initialize OpenAI client
        api_key = self.config.api_key or os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OpenAI API key not found. Set OPENAI_API_KEY environment variable.")
        
        self.client = AsyncOpenAI(api_key=api_key)
        logger.info(f"Initialized LLM client with provider: {self.config.provider}, model: {self.config.model}")
    
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
            
            # Add response format if specified (for JSON mode)
            if response_format:
                kwargs["response_format"] = response_format
            
            response = await self.client.chat.completions.create(**kwargs)
            
            content = response.choices[0].message.content
            tokens_used = response.usage.total_tokens
            
            # Extract confidence from logprobs if available
            confidence = self._extract_confidence(response)
            
            logger.info(f"LLM generation successful. Tokens used: {tokens_used}")
            
            return LLMResponse(
                content=content,
                model=self.config.model,
                tokens_used=tokens_used,
                confidence=confidence
            )
        
        except Exception as e:
            logger.error(f"LLM generation failed: {e}")
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
        import json
        
        response = await self.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=temperature,
            response_format={"type": "json_object"}
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
        model: str = "text-embedding-3-large"
    ) -> List[float]:
        """
        Generate embedding vector for text
        """
        try:
            response = await self.client.embeddings.create(
                model=model,
                input=text
            )
            
            embedding = response.data[0].embedding
            logger.debug(f"Generated embedding with {len(embedding)} dimensions")
            
            return embedding
        
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            raise
    
    async def generate_embeddings_batch(
        self,
        texts: List[str],
        model: str = "text-embedding-3-large",
        batch_size: int = 100
    ) -> List[List[float]]:
        """
        Generate embeddings for multiple texts in batches
        """
        embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            
            try:
                response = await self.client.embeddings.create(
                    model=model,
                    input=batch
                )
                
                batch_embeddings = [item.embedding for item in response.data]
                embeddings.extend(batch_embeddings)
                
                logger.info(f"Generated embeddings for batch {i//batch_size + 1}/{(len(texts)-1)//batch_size + 1}")
            
            except Exception as e:
                logger.error(f"Batch embedding generation failed: {e}")
                raise
        
        return embeddings
    
    def _extract_confidence(self, response) -> Optional[float]:
        """
        Extract confidence score from response logprobs
        
        For now, returns None. Can be enhanced with logprobs in future.
        """
        # OpenAI doesn't provide confidence scores directly
        # We'll calculate this separately in the confidence system
        return None


# Global LLM client instance
_llm_client: Optional[LLMClient] = None


def get_llm_client() -> LLMClient:
    """
    Get or create global LLM client instance
    """
    global _llm_client
    
    if _llm_client is None:
        _llm_client = LLMClient()
    
    return _llm_client
