const express = require('express')
const NotesService = require('./notes-service')
const path = require('path')


const notesRouter = express.Router()
const jsonParser = express.json()

const serializeNote = note => ({
    id: note.id,
    title: note.title,
    modified:note.modified,
    folder_id:note.folder_id,
    content:note.content
})

notesRouter
.route('/')
.get((req,res,next) => {
    NotesService.getAllNotes(req.app.get('db'))
    .then(notes => {
        res.json(notes.map(serializeNote))
    })
    .catch(next)
})
.post(jsonParser, (req, res, next) => {
    const {title, modified, folder_id, content} = req.body
    const newNote = {title, folder_id, content}

    for(const [key, value] of Object.entries(newNote)) {
        if ( value == null) {
            return res.status(400).json({
                error: { message: `Missing '${key}' in request body`}
            })
        }
    }

    newNote.modified = modified
    NotesService.insertNote(
        req.app.get('db'),
        newNote
    )
    .then(note => {
        res.status(201)
        .location(path.posix.join(req.originalUrl, `/${note.id}`))
        .json(serializeNote(note))
    })
    .catch(next)
})

notesRouter
.route('/:note_id') //note_id
.all((req,res,next) => {
 const {note_id} = req.params
 NotesService.getById(
    req.app.get('db'), 
    note_id
    )
 .then(note => {
    if (!note) {
        return res.status(404).json({
            error: {message: `Note Not Found`}
        })
    }
    res.note = note
    next()
 })
 .catch(next)
 })
.get((req, res, next) => {
    res.json({
        id:res.note.id,
        title: res.note.title,
        modified:res.note.modified,
        folder_id:res.note.folder_id,
        content:res.note.content,
    })
})
.patch(jsonParser, (req, res, next) => {
    const{title, modified, folder_id, content} = req.body
    const noteToUpdate = {title,modified,folder_id, content}

    const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length

    if(numberOfValues === 0) {
        return res.status(400).json({
            error: {
                message: `Request body must contain 'title','modified','folder_id','content'`
            }
        })
    }

    NotesService.updateNote(
        req.app.get('db'),
        req.params.note_id, //note_id
        noteToUpdate
    )
    .then(numRowsAffected => {
        res.status(204).end()
    })
    .catch(next)
})
.delete((req,res,next) => {
    NotesService.deleteNote(
        req.app.get('db'),
        req.params.note_id //note_id
    )
    .then(() => {
        res.status(204).end()
    })
    .catch(next)
})
module.exports = notesRouter