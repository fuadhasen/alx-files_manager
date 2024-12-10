const fs = require('fs');
const mime = require('mime-types');
const path = require('path');
const {ObjectId} = require('mongodb')

import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const { v4: uuidv4 } = require('uuid');


class FilesController {
  static postUpload(req, res) {
    const acceptedType = ['folder', 'file', 'image']
    const file = dbClient.fileCollection;
    const token = req.headers['x-token']
    const { name, type, data, parentId, isPublic } = req.body
    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    let userId;

    redisClient.get(`auth_${token}`)
    .then((doc_id) => {
      if (!doc_id) {
        return res.status(401).json({"error": 'Unauthorized'});
      }

      userId = doc_id;
      if (!name) {
        return res.status(400).json({"error": "Missing name"});
      }
  
      if (!type || !(acceptedType.includes(type))) {
        return res.status(400).json({"error": "Missing type"});
      }
  
      if (!data && type !== 'folder') {
        return res.status(400).json({"error": "Missing data"});
      }
    
      if (parentId) {
        file.findOne({"_id": ObjectId(parentId)}, (error, document) => {
          if (!document) {
            return res.status(400).json({"error": "Parent not found"});
          }
  
          if (document.type !== 'folder') {
            return res.status(400).json({"error": "Parent is not a folder"});
          }
        })
      }

      const newFile = {
        "userId": userId,
        "name": name,
        "type": type,
        "isPublic":isPublic ? isPublic : false,
        "parentId":parentId ? parentId: 0
      }

      if (type === 'folder') {
        file.insertOne(newFile, (err, reply) => {
          const folderResponse = {
            ...newFile,
            id: reply.insertedId
          }
          delete folderResponse._id;
          return res.status(201).json(folderResponse);
        });
      } else {  
        const fileName = uuidv4();
        const fullPath = path.join(folderPath, fileName);
      
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath)
        }
        const cont = String(data);
        const content = Buffer.from(String(data), 'base64').toString('utf-8');
        fs.writeFile(fullPath, content, (err) => {
          if (err) {
            console.log(err);
          }
          const newFile2 = {
            ...newFile,
            localPath: fullPath
          }
          file.insertOne(newFile2, (err, reply) => {
            const fileResponse = {
              ...newFile,
              id: reply.insertedId
            }
            return res.status(201).json(fileResponse);
          });
        })
      }
    }) 
  }

  static getShow(req, res) {
    const token = req.headers['x-token']
    const file = dbClient.fileCollection;

    redisClient.get(`auth_${token}`)
    .then((user_id) => {
      if (!user_id) {
        return res.status(401).json({"error": 'Unauthorized'});
      }

      const doc_id = req.params.id;
      if (doc_id) {
        file.findOne({"_id": ObjectId(doc_id)}, (error, document) => {
          if (!document) {
            return res.status(404).json({"error": "Not found"});
          }
          const response = {
            id: document._id.toString(),
            userId: document.userId,
            name: document.name,
            type: document.type,
            isPublic: document.isPublic,
            parentId: document.parentId
          }
          return res.status(400).json(response);
        })
      }
    })
  }

  static getIndex(req, res) {
    const token = req.headers['x-token']
    const file = dbClient.fileCollection;

    redisClient.get(`auth_${token}`)
    .then((user_id) => {
      if (!user_id) {
        return res.status(401).json({"error": 'Unauthorized'});
      }

      const parentId = req.query.parentId;
      if (!parentId) {
        file.find({}).toArray((err, document) => {
          console.log(document);
          const result = document.map((item) => {
            return {
              id:  item._id.toString(),
              userId: item.userId,
              name: item.name,
              type: item.type,
              isPublic: item.isPublic,
              parentId: item.parentId
            }
          })
          return res.status(400).json(result)
        })

      } else {
        file.findOne({"parentId": String(parentId)}, (error, document) => {
          console.log(document);
          if (!document) {
            // if not return empty list file parentId is => 0(root)
            return res.status(404).send([])
          }
          const response = {
            id: document._id.toString(),
            userId: document.userId,
            name: document.name,
            type: document.type,
            isPublic: document.isPublic,
            parentId: document.parentId
          }
          return res.status(400).json(response);
        })
      }
    })
  }

  static putPublish(req, res) {
    const token = req.headers['x-token']
    const file = dbClient.fileCollection;

    redisClient.get(`auth_${token}`)
    .then((user_id) => {
      // Authentication with token
      if (!user_id) {
        return res.status(401).json({"error": 'Unauthorized'});
      }
      const file_id = req.params.id;

      file.findOne({"_id": ObjectId(file_id)}, (error, document) => {
        if (!document) {
          return res.status(404).json({"error": "Not found"});
        }

        // update the specified document
        file.updateOne(
          {"_id": ObjectId(file_id)},
          {$set: {isPublic: true}},
        )

        file.findOne({"_id": ObjectId(file_id)}, (error, document) => {
          const response = {
            id: document._id.toString(),
            userId: document.userId,
            name: document.name,
            type: document.type,
            isPublic: document.isPublic,
            parentId: document.parentId
          }
          return res.status(400).json(response); 
        })

      })
    })
  }

  static putUnpublish(req, res) {
    const token = req.headers['x-token']
    const file = dbClient.fileCollection;

    redisClient.get(`auth_${token}`)
    .then((user_id) => {
      // Authentication with token
      if (!user_id) {
        return res.status(401).json({"error": 'Unauthorized'});
      }
      const file_id = req.params.id;

      file.findOne({"_id": ObjectId(file_id)}, (error, document) => {
        if (!document) {
          return res.status(404).json({"error": "Not found"});
        }

        // update the specified document and return new document
        file.updateOne(
          {"_id": ObjectId(file_id)},
          {$set: {isPublic: false}},
        )

        file.findOne({"_id": ObjectId(file_id)}, (error, document) => {
          const response = {
            id: document._id.toString(),
            userId: document.userId,
            name: document.name,
            type: document.type,
            isPublic: document.isPublic,
            parentId: document.parentId
          }
          return res.status(400).json(response); 
        })
      })
    })

  }

  static getFile(req, res) {
    const token = req.headers['x-token']
    const file = dbClient.fileCollection;

    redisClient.get(`auth_${token}`)
    .then((user_id) => {
      // Authentication with token
      const file_id = req.params.id;

      file.findOne({"_id": ObjectId(file_id)}, (error, document) => {
        if (!document) {
          console.log('ere ezi negn')
          return res.status(404).json({"error": "Not found"});
        }

        // if public no authentication otherwise it needs authentication to serve file
        if (!document.isPublic) {
          if (!user_id || user_id != document.userId) {
            console.log(user_id)
            console.log(document.userId);
            return res.status(404).json({"error": 'Not found'});
          }
        }

        if (document.type == 'folder') {
          return res.status(400).json({"error": "A folder doesn\'t have content"});
        }
        const resolvedPath = path.resolve(document.localPath)
        console.log(resolvedPath)
        console.log(document.localPath);
        if (!fs.existsSync(resolvedPath)) {
          console.log('ayi ezi eko negn')
          return res.status(404).json({"error": "Not found"})
        }

        const mimeType = mime.lookup(document.name);
        res.setHeaders('content-Type', mimeType);
        fs.readFile((document.localPath), (err, content) => {
          return res.send(content)
        })
      })
    })

  }
}

export default FilesController;
