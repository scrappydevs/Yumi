"""
Supabase client configuration
"""
import os
from supabase import create_client, Client
from typing import Optional, Dict, Any, List

class SupabaseClient:
    _instance: Optional[Client] = None
    
    @classmethod
    def initialize(cls):
        """Initialize Supabase client"""
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")
        
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set")
        
        cls._instance = create_client(url, key)
        print(f"✅ Supabase client initialized: {url}")
        return cls._instance
    
    @classmethod
    def get_client(cls) -> Client:
        """Get the Supabase client instance"""
        if cls._instance is None:
            cls.initialize()
        return cls._instance
    
    @classmethod
    def execute_query(cls, query: str) -> Dict[str, Any]:
        """
        Execute a raw SQL query on Supabase and return the results
        
        This method uses Supabase's RPC function to execute SQL queries.
        Requires the execute_sql() function to be created in Supabase.
        See supabase_sql_setup.sql for setup instructions.
        
        Args:
            query: SQL query string to execute
            
        Returns:
            Dict containing success status, data, and any error information
            
        Example:
            result = SupabaseClient.execute_query("SELECT * FROM issues LIMIT 5")
            if result['success']:
                print(result['data'])
        """
        try:
            client = cls.get_client()
            
            # Execute the query using Supabase's RPC method
            # This calls the execute_sql() function in the database
            response = client.rpc('execute_sql', {'query': query}).execute()
            
            return {
                'success': True,
                'data': response.data,
                'count': len(response.data) if response.data else 0,
                'query': query
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'data': None,
                'count': 0,
                'query': query
            }
    
    @classmethod
    def query_table(cls, table: str, select: str = "*", filters: Optional[Dict[str, Any]] = None, 
                    limit: Optional[int] = None, order_by: Optional[str] = None) -> Dict[str, Any]:
        """
        Simpler method to query a table without raw SQL
        
        This doesn't require any SQL function setup and works immediately.
        
        Args:
            table: Table name to query
            select: Columns to select (default: "*")
            filters: Dict of column:value pairs to filter by
            limit: Maximum number of rows to return
            order_by: Column to order by (prefix with '-' for descending)
            
        Returns:
            Dict containing success status, data, and any error information
            
        Example:
            result = SupabaseClient.query_table(
                "issues", 
                select="id,description,status",
                filters={"status": "complete"},
                limit=10,
                order_by="-timestamp"
            )
        """
        try:
            client = cls.get_client()
            
            # Build query
            query = client.table(table).select(select)
            
            # Apply filters
            if filters:
                for column, value in filters.items():
                    query = query.eq(column, value)
            
            # Apply ordering
            if order_by:
                if order_by.startswith('-'):
                    query = query.order(order_by[1:], desc=True)
                else:
                    query = query.order(order_by, desc=False)
            
            # Apply limit
            if limit:
                query = query.limit(limit)
            
            response = query.execute()
            
            return {
                'success': True,
                'data': response.data,
                'count': len(response.data) if response.data else 0,
                'table': table
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'data': None,
                'count': 0,
                'table': table
            }

def get_supabase() -> Client:
    """Dependency to get Supabase client"""
    return SupabaseClient.get_client()


def execute_sql_query(query: str) -> Dict[str, Any]:
    """
    Helper function to execute SQL queries
    
    Args:
        query: SQL query string to execute
        
    Returns:
        Dict containing query results or error information
    """
    return SupabaseClient.execute_query(query)
