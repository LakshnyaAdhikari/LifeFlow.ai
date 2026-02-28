"""
Search History Router

Endpoints for managing user search history
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.database import get_db
from app.routers.auth import get_current_user
from app.models.core import User
from app.models.search import SearchHistory
from app.auth_models import UserDependent

router = APIRouter(prefix="/api/search-history", tags=["search-history"])

# --- Schemas ---

class SearchHistoryCreate(BaseModel):
    """Schema for creating a new search history entry"""
    query: str
    domain: Optional[str] = None
    
    class Config:
        from_attributes = True


class SearchHistoryResponse(BaseModel):
    """Schema for returning search history data"""
    id: int
    query: str
    domain: Optional[str]
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# --- Endpoints ---

@router.post("", response_model=SearchHistoryResponse, status_code=201)
def save_search_to_history(
    search_data: SearchHistoryCreate,
    db: Session = Depends(get_db),
    current_user: UserDependent = Depends(get_current_user),
):
    """
    Save a search query to the user's search history
    
    Args:
        search_data: Contains query and optional domain
        db: Database session
        current_user: Currently authenticated user
        
    Returns:
        The created search history entry
    """
    try:
        # Create new search history entry
        search_entry = SearchHistory(
            user_id=current_user.id,
            query=search_data.query.strip(),
            domain=search_data.domain,
            created_at=datetime.utcnow()
        )
        
        db.add(search_entry)
        db.commit()
        db.refresh(search_entry)
        
        return search_entry
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save search: {str(e)}")


@router.get("", response_model=List[SearchHistoryResponse])
def get_search_history(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    domain: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: UserDependent = Depends(get_current_user),
):
    """
    Retrieve user's search history
    
    Args:
        limit: Maximum number of items to return (default: 50, max: 100)
        offset: Number of items to skip (for pagination)
        domain: Optional domain filter
        db: Database session
        current_user: Currently authenticated user
        
    Returns:
        List of search history entries, sorted by most recent first
    """
    try:
        query = db.query(SearchHistory).filter(
            SearchHistory.user_id == current_user.id
        )
        
        # Apply domain filter if provided
        if domain:
            query = query.filter(SearchHistory.domain == domain)
        
        # Get total count before limiting
        total_count = query.count()
        
        # Order by most recent first and apply pagination
        searches = query.order_by(
            SearchHistory.created_at.desc()
        ).offset(offset).limit(limit).all()
        
        return searches
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch search history: {str(e)}")


@router.delete("/{search_id}")
def delete_search_history_entry(
    search_id: int,
    db: Session = Depends(get_db),
    current_user: UserDependent = Depends(get_current_user),
):
    """
    Delete a specific search history entry
    
    Args:
        search_id: ID of the search history entry to delete
        db: Database session
        current_user: Currently authenticated user
        
    Returns:
        Success message
    """
    try:
        # Find the search entry
        search_entry = db.query(SearchHistory).filter(
            SearchHistory.id == search_id,
            SearchHistory.user_id == current_user.id  # Ensure user owns this entry
        ).first()
        
        if not search_entry:
            raise HTTPException(status_code=404, detail="Search history entry not found")
        
        # Delete it
        db.delete(search_entry)
        db.commit()
        
        return {"message": "Search history deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete search: {str(e)}")


@router.delete("")
def clear_all_search_history(
    db: Session = Depends(get_db),
    current_user: UserDependent = Depends(get_current_user),
):
    """
    Clear all search history for the current user
    
    Args:
        db: Database session
        current_user: Currently authenticated user
        
    Returns:
        Success message with count of deleted items
    """
    try:
        # Get count of items to delete
        count = db.query(SearchHistory).filter(
            SearchHistory.user_id == current_user.id
        ).count()
        
        # Delete all entries
        db.query(SearchHistory).filter(
            SearchHistory.user_id == current_user.id
        ).delete()
        
        db.commit()
        
        return {"message": f"Cleared {count} search history entries"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to clear search history: {str(e)}")
