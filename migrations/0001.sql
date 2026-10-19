CREATE TABLE IF NOT EXISTS participants(id TEXT PRIMARY KEY, age INTEGER NOT NULL, date TEXT NOT NULL, score INTEGER, percentage REAL, completed INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS trials(participant_id TEXT REFERENCES participants(id), image_id TEXT, presentation_order INTEGER, image_url TEXT, correct_answer TEXT, model TEXT, generation_level INTEGER, participant_answer TEXT, is_correct INTEGER, PRIMARY KEY(participant_id,presentation_order));
CREATE INDEX IF NOT EXISTS completed_participants ON participants(completed,date);
CREATE TRIGGER IF NOT EXISTS finish_participant AFTER UPDATE OF participant_answer ON trials
WHEN (SELECT COUNT(*) FROM trials WHERE participant_id=NEW.participant_id AND participant_answer IS NOT NULL)=12
BEGIN
UPDATE participants SET completed=1,score=(SELECT SUM(is_correct) FROM trials WHERE participant_id=NEW.participant_id),percentage=(SELECT SUM(is_correct)*100.0/12 FROM trials WHERE participant_id=NEW.participant_id) WHERE id=NEW.participant_id;
END;
