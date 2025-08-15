CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  service_request_id UUID REFERENCES service_requests(id) ON DELETE CASCADE,
  client_id UUID REFERENCES users(id) ON DELETE CASCADE,
  freelancer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT check_conversation_type CHECK (
    (project_id IS NOT NULL AND service_request_id IS NULL) OR
    (project_id IS NULL AND service_request_id IS NOT NULL)
  )
);

-- Performance indexes
CREATE INDEX idx_conversations_participants ON conversations(client_id, freelancer_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX idx_conversations_project ON conversations(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_conversations_service_request ON conversations(service_request_id) WHERE service_request_id IS NOT NULL;


