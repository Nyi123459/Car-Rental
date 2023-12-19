const fs = require("fs");

const deleteFile = (filePath) => {
  console.log("filepath", filePath);
  fs.unlink(filePath, (err) => {
    if (err) {
      throw err;
    }
  });
};

exports.deleteFile = deleteFile;
