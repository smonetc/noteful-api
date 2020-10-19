const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')

describe('Folders Endpoints', function() {
    let db

    before('make knex instance', () => {
      db = knex({
        client: 'pg',
        connection: process.env.TEST_DB_URL,
      })
      app.set('db', db)
    })
  
    after('disconnect from db', () => db.destroy())
  
    before('clean the table', () => db('folders').truncate())
})