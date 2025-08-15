CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT chk_message_content_length CHECK (char_length(content) <= 10000),
  CONSTRAINT chk_file_message_fields CHECK (
    (message_type <> 'file' AND file_url IS NULL AND file_name IS NULL AND file_size IS NULL) OR
    (message_type = 'file' AND file_url IS NOT NULL AND file_name IS NOT NULL AND file_size IS NOT NULL)
  )
);

-- Performance indexes
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = false;
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- Maintain conversations.last_message_at on new messages
CREATE OR REPLACE FUNCTION trg_messages_set_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_after_insert
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION trg_messages_set_last_message_at();

-- Prevent mutation of system messages
CREATE OR REPLACE FUNCTION trg_messages_block_system_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.message_type = 'system') THEN
    RAISE EXCEPTION 'System messages cannot be updated';
  ELSIF (TG_OP = 'DELETE' AND OLD.message_type = 'system') THEN
    RAISE EXCEPTION 'System messages cannot be deleted';
  END IF;
  IF (TG_OP = 'UPDATE') THEN
    RETURN NEW;
  ELSE
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_before_update
BEFORE UPDATE ON messages
FOR EACH ROW EXECUTE FUNCTION trg_messages_block_system_changes();

CREATE TRIGGER messages_before_delete
BEFORE DELETE ON messages
FOR EACH ROW EXECUTE FUNCTION trg_messages_block_system_changes();


