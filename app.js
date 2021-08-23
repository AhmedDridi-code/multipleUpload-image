//Upload Image test Application
/***** GLOBAL IMPORTS *****/
const express = require('express');

const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const multer = require("multer");
require('dotenv').config();
app.use("/uploads", express.static(process.env.UPLOAD_FILE_PATH));
const storage = multer.diskStorage({
    //configure path of the destination of the upload images
    destination: function (req, file, cb) {
        cb(null, process.env.UPLOAD_FILE_PATH);
    },
    filename: function (req, file, cb) {
        //configure the name of the images
        var extension = "";
        if (file.mimetype === 'image/jpeg') {
            extension = file.mimetype.slice(file.mimetype.length - 4, file.mimetype.length);
        } else {
            extension = file.mimetype.slice(file.mimetype.length - 3, file.mimetype.length);
        }
        let name = mongoose.Types.ObjectId();
        console.log(name + "." + extension);
        cb(null, name + "." + extension);
    }
})
const fileFilter = (req, file, cb) => {
    // Accept only the images with the extention jpeg or png
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(new Error('the file extension is not valide'), false);
    }

};
const upload = multer({
    storage: storage, limits: {
        fileSize: 1024 * 1024 * 5
    }, fileFilter: fileFilter
});

mongoose.connect("mongodb://localhost:27017/myapp");
const imageSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    logo: String,
    image: String
})
const Image = mongoose.model("Image", imageSchema);
/***** UTILS CONFIG *****/
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// Home Route
app.get("/", (req, res) => {
    res.send("Welcome to upload image");
});
//Getting all images route
app.get("/image", (req, res) => {
    const images = Image.find({}).then(results => {
        res.status(200).json(results);
    }).catch(err => {
        res.status(500).json({ error: err.message });
    })
})
//Posting Multiple Images Route
var multipleUpload = upload.fields([{ name: "logo", maxCount: 1 }, { name: "image", maxCount: 1 }]);
app.post("/image", multipleUpload, (req, res) => {
    //console.log(req.files);
    //const { logo, img } = req.files;

    //preparing Image Link to put it in mongo Database
    const imageLink = process.env.URL+"uploads/" + req.files.image[0].filename;
    const logoLink = process.env.URL+"uploads/" + req.files.logo[0].filename;

    console.log("image : " + imageLink);
    console.log("logo : " + logoLink);
    //Creating image object with name and image link attributes
    const image = new Image({
        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        logo: logoLink,
        image: imageLink,
    });
    //Saving the image object to database
    image.save().then(result => {
        console.log(result)
        res.status(200).json(result);
    }).catch(err => {
        res.status(500).json({ error: err.message });
    })
});
app.listen(8080, () => {
    console.log("listening to port " + 8080);
});