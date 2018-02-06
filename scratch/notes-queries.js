'use strict';

const knex = require('../knex');

knex
  .from('note')
  .select()
  .then(res => console.log(res));
