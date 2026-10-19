-- Preserve previous 12-image sessions and their scores. New sessions snapshot their total.
ALTER TABLE participants ADD COLUMN expected_trials INTEGER NOT NULL DEFAULT 12;
ALTER TABLE participants ADD COLUMN experiment_version TEXT NOT NULL DEFAULT 'legacy-12';
DROP TRIGGER IF EXISTS finish_participant;
CREATE TRIGGER finish_participant AFTER UPDATE OF participant_answer ON trials
WHEN (SELECT COUNT(*) FROM trials WHERE participant_id=NEW.participant_id AND participant_answer IS NOT NULL)=(SELECT expected_trials FROM participants WHERE id=NEW.participant_id)
BEGIN
 UPDATE participants SET completed=1,
 score=(SELECT SUM(is_correct) FROM trials WHERE participant_id=NEW.participant_id),
 percentage=(SELECT SUM(is_correct)*100.0 FROM trials WHERE participant_id=NEW.participant_id)/expected_trials
 WHERE id=NEW.participant_id;
END;
