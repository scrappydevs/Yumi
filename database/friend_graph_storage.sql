-- Friend Graph Storage Schema (following auctor-1 pattern)
-- Stores computed graph layout so we don't recalculate every time

CREATE TABLE IF NOT EXISTS friend_graphs (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_computed_at TIMESTAMPTZ DEFAULT NOW(),
    -- Store the graph content as JSONB (nodes, edges, viewport)
    graph_content JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_friend_graphs_updated ON friend_graphs(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_friend_graphs_computed ON friend_graphs(last_computed_at);

-- Function to upsert friend graph
CREATE OR REPLACE FUNCTION upsert_friend_graph(
    p_user_id UUID,
    p_graph_content JSONB
) RETURNS VOID AS $$
BEGIN
    INSERT INTO friend_graphs (user_id, graph_content, last_computed_at, updated_at)
    VALUES (p_user_id, p_graph_content, NOW(), NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET
        graph_content = p_graph_content,
        last_computed_at = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE friend_graphs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own graph"
    ON friend_graphs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own graph"
    ON friend_graphs FOR ALL
    USING (auth.uid() = user_id);

-- Optional: Function to check if graph needs refresh (older than 1 hour)
CREATE OR REPLACE FUNCTION friend_graph_needs_refresh(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    last_computed TIMESTAMPTZ;
BEGIN
    SELECT last_computed_at INTO last_computed
    FROM friend_graphs
    WHERE user_id = p_user_id;
    
    IF last_computed IS NULL THEN
        RETURN TRUE;
    END IF;
    
    RETURN (NOW() - last_computed) > INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

