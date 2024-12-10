const fs = require('fs');
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
}

export default FilesController;
