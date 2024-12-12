import dbClient from './utils/db';

const fs = require('fs');
const { ObjectId } = require('mongodb');
const Bull = require('bull');
const thumbnail = require('image-thumbnail');
const fileQueue = new Bull('fileQueue');


fileQueue.process((job) => {
  console.log(job.data)
  const file = dbClient.fileCollection

  try {
    if (!job.data.fileId) {
      console.log('first if');
      throw new Error('Missing fileId');
    }
  
    if (!job.data.userId) {
      console.log('second if');
      throw new Error('Missing userId');
    }

    console.log(job.data.fileId)
    console.log(job.data.userId)
    file.findOne({"_id": ObjectId(job.data.fileId), "userId": String(job.data.userId)}, async (error, document) => {
      console.log(document);
      if (!document) {
        throw new Error('File not found');
      }
    
      const options = [
        { width: 500 },
        { width: 250 },
        { width: 100 }
      ];

      const thumb1 = await thumbnail(document.localPath, options[0])
      const thumb2 = await thumbnail(document.localPath, options[1])
      const thumb3 = await thumbnail(document.localPath, options[2])


      fs.writeFileSync(`${document.localPath}_500`, thumb1)
      console.log('done')
      fs.writeFileSync(`${document.localPath}_250`, thumb2)
      fs.writeFileSync(`${document.localPath}_100`, thumb3)

    })
  } catch (error) {
    console.error(error);
    throw error;
  }
})
