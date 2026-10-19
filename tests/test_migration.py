import sqlite3, unittest
from pathlib import Path

class MigrationTest(unittest.TestCase):
    def test_preserves_completed_and_unfinished_legacy_sessions(self):
        con=sqlite3.connect(':memory:')
        con.executescript(Path('migrations/0001.sql').read_text())
        for pid in ['legacy-complete','legacy-unfinished']:
            con.execute('INSERT INTO participants(id,age,date) VALUES(?,?,?)',(pid,16,'2026-10-01T00:00:00Z'))
            for n in range(12):
                con.execute('INSERT INTO trials VALUES(?,?,?,?,?,?,?,?,?)',(pid,f'old-{n}',n+1,'/old.jpg','real','Fotografía real',0,None,None))
        for n in range(12):con.execute("UPDATE trials SET participant_answer='real',is_correct=1 WHERE participant_id='legacy-complete' AND presentation_order=?",(n+1,))
        before=list(con.execute("SELECT id,age,date,score,percentage,completed FROM participants ORDER BY id"))
        answers=list(con.execute('SELECT * FROM trials ORDER BY participant_id,presentation_order'))
        con.executescript(Path('migrations/0002_twenty_images.sql').read_text())
        self.assertEqual(before,list(con.execute("SELECT id,age,date,score,percentage,completed FROM participants ORDER BY id")))
        self.assertEqual(answers,list(con.execute('SELECT * FROM trials ORDER BY participant_id,presentation_order')))
        for n in range(12):con.execute("UPDATE trials SET participant_answer='ai',is_correct=0 WHERE participant_id='legacy-unfinished' AND presentation_order=?",(n+1,))
        self.assertEqual(con.execute("SELECT completed,score,percentage,expected_trials FROM participants WHERE id='legacy-unfinished'").fetchone(),(1,0,0.0,12))
        con.execute("INSERT INTO participants(id,age,date,expected_trials,experiment_version) VALUES('new',17,'2026-10-19',20,'study-20-v1')")
        for n in range(20):con.execute('INSERT INTO trials VALUES(?,?,?,?,?,?,?,?,?)',('new',f'new-{n}',n+1,'/new.jpg','real','Fotografía real',0,None,None))
        for n in range(12):con.execute("UPDATE trials SET participant_answer='real',is_correct=1 WHERE participant_id='new' AND presentation_order=?",(n+1,))
        self.assertEqual(con.execute("SELECT completed FROM participants WHERE id='new'").fetchone()[0],0)
        for n in range(12,20):con.execute("UPDATE trials SET participant_answer='ai',is_correct=0 WHERE participant_id='new' AND presentation_order=?",(n+1,))
        self.assertEqual(con.execute("SELECT completed,score,percentage FROM participants WHERE id='new'").fetchone(),(1,12,60.0))

if __name__=='__main__':unittest.main()
