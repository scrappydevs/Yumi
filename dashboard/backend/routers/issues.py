"""
Issues API router
"""
from fastapi import APIRouter, HTTPException, Depends
from supabase import Client
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from supabase_client import get_supabase

router = APIRouter(prefix="/api/issues", tags=["issues"])

class Group(BaseModel):
    id: int
    name: str
    created_at: Optional[datetime] = None

class Issue(BaseModel):
    id: str
    image_id: Optional[str] = None  # URL to image in Supabase storage
    group_id: Optional[int] = None
    description: Optional[str] = None
    geolocation: Optional[str] = None
    timestamp: datetime
    status: Optional[str] = None
    priority: Optional[int] = None  # 1 = Low, 2 = Medium, 3 = High
    uid: Optional[str] = None  # Reporter user ID

class IssueStats(BaseModel):
    total_issues: int
    resolved: int
    resolution_rate: float
    in_progress: int
    critical: int

class IssueUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[int] = None
    description: Optional[str] = None
    group_id: Optional[int] = None

@router.get("/", response_model=List[Issue])
async def get_issues(
    status: Optional[str] = None,
    limit: int = 100,
    supabase: Client = Depends(get_supabase)
):
    """
    Get all issues from the database
    
    - **status**: Filter by status (complete/incomplete)
    - **limit**: Maximum number of issues to return
    """
    try:
        query = supabase.table("issues").select("*").order("timestamp", desc=True)
        
        if status:
            query = query.eq("status", status)
        
        if limit:
            query = query.limit(limit)
        
        response = query.execute()
        
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch issues: {str(e)}")

@router.get("/stats", response_model=IssueStats)
async def get_issue_stats(supabase: Client = Depends(get_supabase)):
    """
    Get aggregated statistics about issues
    """
    try:
        # Get all issues
        response = supabase.table("issues").select("status").execute()
        issues = response.data
        
        total = len(issues)
        resolved = len([i for i in issues if i.get("status") == "complete"])
        in_progress = len([i for i in issues if i.get("status") == "incomplete"])
        resolution_rate = round((resolved / total * 100), 1) if total > 0 else 0
        
        # Estimate critical (20% of in-progress)
        critical = int(in_progress * 0.2)
        
        return {
            "total_issues": total,
            "resolved": resolved,
            "resolution_rate": resolution_rate,
            "in_progress": in_progress,
            "critical": critical,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stats: {str(e)}")

@router.get("/{issue_id}", response_model=Issue)
async def get_issue(issue_id: str, supabase: Client = Depends(get_supabase)):
    """Get a single issue by ID"""
    try:
        response = supabase.table("issues").select("*").eq("id", issue_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Issue not found")
        
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch issue: {str(e)}")

@router.get("/groups/all", response_model=List[Group])
async def get_groups(supabase: Client = Depends(get_supabase)):
    """
    Get all issue groups/categories
    """
    try:
        response = supabase.table("groups").select("*").order("name").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch groups: {str(e)}")

@router.patch("/{issue_id}", response_model=Issue)
async def update_issue(
    issue_id: str,
    issue_update: IssueUpdate,
    supabase: Client = Depends(get_supabase)
):
    """
    Update an issue's fields
    """
    try:
        # Build update dict with only provided fields
        update_data = {}
        if issue_update.status is not None:
            update_data["status"] = issue_update.status
        if issue_update.priority is not None:
            update_data["priority"] = issue_update.priority
        if issue_update.description is not None:
            update_data["description"] = issue_update.description
        if issue_update.group_id is not None:
            update_data["group_id"] = issue_update.group_id
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        response = supabase.table("issues").update(update_data).eq("id", issue_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Issue not found")
        
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update issue: {str(e)}")

@router.delete("/{issue_id}")
async def delete_issue(issue_id: str, supabase: Client = Depends(get_supabase)):
    """
    Delete an issue from the database
    """
    try:
        # Check if issue exists
        check_response = supabase.table("issues").select("id").eq("id", issue_id).execute()
        if not check_response.data:
            raise HTTPException(status_code=404, detail="Issue not found")
        
        # Delete the issue
        response = supabase.table("issues").delete().eq("id", issue_id).execute()
        
        return {"success": True, "message": "Issue deleted successfully", "id": issue_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete issue: {str(e)}")

