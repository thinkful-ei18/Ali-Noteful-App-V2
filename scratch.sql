DROP TABLE IF EXISTS tags;

CREATE TABLE tags (
  id serial PRIMARY KEY,
  name text NOT NULL
);

DROP TABLE IF EXISTS notes_tags;

CREATE TABLE notes_tags (
  note_id INTEGER NOT NULL REFERENCES note ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags ON DELETE CASCADE
);

INSERT INTO tags 
(name) VALUES
('SQL'),
('IMPORTANT'),
('CSS');


INSERT INTO notes_tags 
(note_id, tag_id) VALUES
('4', '1'),
('5', '2');

SELECT note.title as "NOTE TITLE", tags.name as "TAG NAME", note.content
FROM NOTE
INNER JOIN notes_tags
ON note.id = notes_tags.note_id
INNER JOIN tags
ON tags.id = notes_tags.tag_id;

SELECT note.title as "NOTE TITLE", tags.name as "TAG NAME", note.content
FROM NOTE
LEFT JOIN notes_tags
ON note.id = notes_tags.note_id
LEFT JOIN tags
ON tags.id = notes_tags.tag_id;

SELECT note.title as "NOTE TITLE", tags.name as "TAG NAME", note.content
FROM NOTE
LEFT JOIN folders ON notes.folder_id = folder.id
LEFT JOIN notes_tags ON note.id = notes_tags.note_id
LEFT JOIN tags ON tags.id = notes_tags.tag_id;


SELECT title, tags.name, note.title, folders.name  FROM note
RIGHT JOIN folders ON note.folder_id = folders.id
LEFT JOIN notes_tags ON note.id = notes_tags.note_id
LEFT JOIN tags ON notes_tags.tag_id = tags.id;