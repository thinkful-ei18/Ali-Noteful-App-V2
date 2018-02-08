'use strict';

const express = require('express');
const knex = require('../knex');

const router = express.Router();


//Get All Folders (no searchTerm needed)

router.get('/folders', (req, res, next) => {
  knex.select('id', 'name')
    .from('folders')
    .then(results => {
      res.json(results);
    })
    .catch(next);
});

//Get All folders id 

router.get('/folders/:id', (req, res, next) => {
  const folderId = req.params.id;
  knex('folders')
    .where({ id: `${folderId}` })
    .then(result => res.json(result[0]))
    .catch(next);
});

//Folder Update 

router.put('/folders/:id', (req, res, next) => {
  const folderId = req.params.id;
  /***** Never trust users - validate input *****/
  const updateObj = {};
  const updateableFields = ['name'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      updateObj[field] = req.body[field];
    }
  });

  /***** Never trust users - validate input *****/
  if (!updateObj.name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  knex('folders')
    .where({ id: `${folderId}` })
    .update(updateObj)
    .then(result => res.json(result))
    .catch(err => next(err));
});

//Folder Create 
router.post('/folders', (req, res, next) => {
  const { name } = req.body;

  const newItem = { name };
  /***** Never trust users - validate input *****/
  if (!newItem.name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }
  knex('folders')
    .insert(newItem)
    .returning(['id', 'name'])
    .then(result => res.json(result))
    .catch(err => next(err));
});

//Folder Delete
router.delete('/folders/:id', (req, res, next) => {
  const folderId = req.params.id;
  knex('folders')
    .where('id', folderId)
    .del()
    .then(() => res.status(204).end())
    .catch(err => next(err));
});









// router.get('/folders', (req, res, next) => {
//   let { searchTerm } = req.query;
//   knex
//     .select('note.id', 'title', 'content', 'folder_id', 'folders.name as folder_name')
//     .from('note')
//     .leftJoin('folders', 'note.folder_id', 'folders.id')
//     .where(function () {
//       if (req.query.folderId) {
//         this.where('folder_id', req.query.folderId);
//       }
//     })
//     .where(function () {
//       if (searchTerm) {
//         this.where('title', 'like', `%${searchTerm}%`);
//       }
//     })
//     .orderBy('note.id')
//     .then(results => {
//       res.json(results);
//     })
//     .catch(err => {
//       console.error(err);
//     });
// });
// //Get Folder By Id
// router.get('/folders/:id', (req, res, next) => {
//   const noteId = req.params.id;
//   knex
//     .select('note.id', 'title', 'content', 'folder_id', 'folders.name as folder_name')
//     .from('note')
//     .leftJoin('folders', 'note.folder_id', 'folders.id')
//     .where(function () {
//       if (req.query.folderId) {
//         this.where('folder_id', req.query.folderId);
//       }
//     })
//     .where(function () {
//       if (searchTerm) {
//         this.where('title', 'like', `%${searchTerm}%`);
//       }
//     })
//     .orderBy('note.id')
//     .then(results => {
//       res.json(results);
//     })
//     .catch(err => {
//       console.error(err);
//     });
// });

// //Folder Update - The noteful app does not use this endpoint but we'll create it in order to round out our RESTful service
// //Create a Folder accepts an object with a name and inserts it in the DB. Returns the new item along the new id.

// router.post('/notes', (req, res, next) => {
//   const { title, content, folder_id } = req.body; // Add `folder_id`
//   /*
//   REMOVED FOR BREVITY
//   */
//   const newItem = {
//     title: title,
//     content: content,
//     folder_id: folder_id  // Add `folder_id`
//   };

//   let noteId;

//   // Insert new note, instead of returning all the fields, just return the new `id`
//   knex.insert(newItem)
//     .into('notes')
//     .returning('id')
//     .then(([id]) => {
//       noteId = id;
//       // Using the new id, select the new note and the folder info
//       return knex.select('notes.id', 'title', 'content', 'folder_id', 'folders.name as folder_name')
//         .from('notes')
//         .leftJoin('folders', 'notes.folder_id', 'folders.id')
//         .where('notes.id', noteId);
//     })
//     .then(([result]) => {
//       res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
//     })
//     .catch(err => {
//       console.error(err);
//     });
// });

//Delete Folder By Id accepts an ID and deletes the folder from the DB and then returns a 204 status.

module.exports = router;