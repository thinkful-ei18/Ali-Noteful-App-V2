'use strict';

const express = require('express');
const Treeize = require('treeize');
const knex = require('../knex');

const router = express.Router();

/* ========== GET/READ ALL NOTES ========== */
router.get('/notes', (req, res, next) => {
  const searchTerm = req.query.searchTerm;
  const folderId = req.query.folderId;
  const tagId = req.query.tagId;

  knex.select('note.id', 'title', 'content', 'folder_id', 'created',
    'folders.name as folder_name',
    'tags.id as tags:id', 'tags.name as tags:name')
    .from('note')
    .leftJoin('folders', 'note.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'note.id', 'notes_tags.note_id')
    .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
    .where(function () {
      if (searchTerm) {
        this.where('title', 'like', `%${searchTerm}%`);
        this.orWhere('content', 'like', `%${searchTerm}%`);
        this.orWhere('folders.name', 'like', `%${searchTerm}%`);
        this.orWhere('tags.name', 'like', `%${searchTerm}%`);
      }
    })
    .where(function () {
      if (folderId) {
        this.where('folder_id', folderId);
      }
    })
    .where(function () {
      if (tagId) {
        const subQuery = knex.select('note.id')
          .from('note')
          .innerJoin('notes_tags', 'note.id', 'notes_tags.note_id')
          .where('notes_tags.tag_id', tagId);
        this.whereIn('note.id', subQuery);
      }
    })
    .orderBy('note.id')
    .then(results => {
      const treeize = new Treeize();
      treeize.setOptions({output: 
        {prune: false}
      });
      treeize.grow(results);
      const hydrated = treeize.getData();
      res.json(hydrated);
    })
    .catch(err => {
      console.error(err);
    });
});

/* ========== GET/READ SINGLE NOTES ========== */
router.get('/notes/:id', (req, res, next) => {
  const noteId = req.params.id;


  knex.select('note.id', 'title', 'content', 'folder_id', 'created',
    'folders.name as folder_name',
    'tags.id as tags:id', 'tags.name as tags:name')
    .from('note')
    .leftJoin('folders', 'note.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'note.id', 'notes_tags.note_id')
    .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
    .where('note.id', noteId)
    .then(result => {
      if(result.length === 0) {
        const err = new Error;
        err.status = 404;
        next(err);
      }
      if (result) {
        const treeize = new Treeize();
        treeize.grow(result);
        const hydrated = treeize.getData();
        res.json(hydrated[0]);
      } else {
        next(); // fall-through to 404 handler
      }
    })
    .catch(next);

});

/* ========== POST/CREATE ITEM ========== */
router.post('/notes', (req, res, next) => {
  const { title, content, folder_id, tags } = req.body;

  /***** Never trust users. Validate input *****/
  if (!req.body.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  const newItem = {
    title: title,
  };
  
  if (folder_id) {
    newItem.folder_id = folder_id;
  }
  if (content) {
    newItem.content = content;
  }
  let noteId;
  knex.insert(newItem)
    .into('note')
    .returning('id')
    .then(([id]) => {
      noteId = id;
      if(tags) {
        const tagsInsert = tags.map(tagId => ({ note_id: noteId, tag_id: tagId }));
        return knex.insert(tagsInsert)
          .into('notes_tags');
      }
    })
    .then(() => {
      return knex.select('note.id', 'title', 'content', 'folder_id',
        'folders.name as folder_name',
        'tags.id as tags:id', 'tags.name as tags:name')
        .from('note')
        .leftJoin('folders', 'note.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'note.id', 'notes_tags.note_id')
        .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
        .where('note.id', noteId);
    })
    .then(result => {
      if (result) {
        const treeize = new Treeize();
        treeize.grow(result);
        const hydrated = treeize.getData();
        res.location(`${req.originalUrl}/${result.id}`).status(201).json(hydrated[0]).done();
      } else {
        next(); // fall-through to 404 handler
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/notes/:id', (req, res, next) => {
  const noteId = req.params.id;
  const { title, content, folder_id, tags } = req.body;

  /***** Never trust users. Validate input *****/
  if (!req.body.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  const updateItem = {
    title: title,
    content: content,
  };

  knex('note')
    .update(updateItem)
    .where('id', noteId)
    .then(() => {
      return knex.del()
        .from('notes_tags')
        .where('note_id', noteId);
    })
    .then(() => {
      if (tags) {
        const tagsInsert = tags.map(tid => ({ note_id: noteId, tag_id: tid }));
        return knex.insert(tagsInsert)
          .into('notes_tags');
      }
    })
    .then(() => {
      return knex.select('note.id', 'title', 'content', 'folder_id',
        'folders.name as folder_name',
        'tags.id as tags:id', 'tags.name as tags:name')
        .from('note')
        .leftJoin('folders', 'note.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'note.id', 'notes_tags.note_id')
        .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
        .where('note.id', noteId);
    })
    .then(result => {
      if (result.length === 0) {
        const err = new Error;
        err.status = 404;
        next(err);
      }
      if (result) {
        const treeize = new Treeize();
        treeize.grow(result);
        const hydrated = treeize.getData();
        res.json(hydrated[0]);
      } else {
        next(); // fall-through to 404 handler
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/notes/:id', (req, res, next) => {
  knex.del()
    .where('id', req.params.id)
    .from('note')
    .then(count => {
      if (count) {
        res.status(204).end();
      } else {
        next(); // fall-through to 404 handler
      }
    })
    .catch(next);
});

module.exports = router;