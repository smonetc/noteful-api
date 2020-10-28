const express = require('express')
const FoldersService = require('./folders-service')
const path = require('path')



const folderRouter = express.Router()
const jsonParser = express.json()

const serializeFolder = folder => ({
    id: folder.id,
    title: folder.title,
})

folderRouter
.route('/')
.get((req, res, next) => {
    FoldersService.getAllFolders(req.app.get('db'))
    .then(folders => {
        res.json(folders.map(serializeFolder))
    })
    .catch(next)
})
.post(jsonParser, (req, res, next) => {
    const { title } = req.body
    const newFolder = {title}

    for (const [key, value] of Object.entries(newFolder)) {
       if (value == null) {
        return res.status(400).json({
        error: { message: `Missing '${key}' in request body` }
        })
        }
    }

    newFolder.title = title
    FoldersService.insertFolder(
      req.app.get('db'),
      newFolder
    )
    .then(folder => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${folder.id}`))
          .json(serializeFolder(folder))
      })
    .catch(next)
})

folderRouter
.route('/:folder_id')
.all((req, res, next) => {
    const { folder_id } = req.params
    FoldersService.getById(req.app.get('db'), folder_id)
    .then(folder => {
        if (!folder) {
          return res.status(404).json({
            error: { message: `Folder Not Found` }
          })
        }
        res.folder = folder
        next()
      })
    .catch(next)
    })
    .get((req, res, next) => {
        res.json({
            id: res.folder.id,
            title: res.folder.title,
        })
    })
    .patch(jsonParser, (req, res, next) => {
        const { title} = req.body
        const folderToUpdate = { title}
        
        const numberOfValues = Object.values(folderToUpdate).filter(Boolean).length
        
        if (numberOfValues === 0) {
        return res.status(400).json({
        error: {
        message: `Request body must contain 'title'`}
      })
        }
        FoldersService.updateFolder(
            req.app.get('db'),
            req.params.folder_id,
            folderToUpdate
        )
        .then(numRowsAffected => {
            res.status(204).end()
        })
        .catch(next)
    })
    .delete((req, res, next) => {
        FoldersService.deleteFolder(
            req.app.get('db'),
            req.params.folder_id
        )
        .then(() => {
            res.status(204).end()
        })
        .catch(next)
})

module.exports = folderRouter