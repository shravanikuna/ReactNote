const express = require("express");
const router = express.Router();
const fetchuser = require("../middleware/fetchuser");
const Note = require("../models/Note");
const { body, validationResult } = require("express-validator");

//ROUTE 1: Get all the notes using GET "/api/notes/fetchallnotes" . Login Required

router.get("/fetchallnotes", fetchuser, async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user.id });
    res.json(notes);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Some error occured");
  }
});


//ROUTE 2: Add a new note using POST "/api/notes/addnote" . Login Required

router.post(
  "/addnote", fetchuser,
  [
    body("title").isLength({ min: 2 }),
    body("description").isLength({ min: 2 }),
  ],
  async (req, res) => {
    try {
      const { title, description, tag } = req.body;
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

      const note = new Note({
        title,
        description,
        tag,
        user: req.user.id
      })
      const savedNotes = await note.save();
      res.json(savedNotes);
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Some error occured");
    }
  }
);

//ROUTE 3: Update note using PUT "/api/notes/updatenote" . Login Required
router.put(
  "/updatenote/:id", fetchuser,
  async (req, res) => {
    const { title, description, tag } = req.body;

    console.log(req.user);
    //Create new note
    try {
      const newNote = {};
      if (title) { newNote.title = title };
      if (description) { newNote.description = description };
      if (tag) { newNote.tag = tag };


      //Find the note to be updated and update it
      let note = await Note.findById(req.params.id);
      if (!note) { return res.status(404).send("Not Found") }
      if (note.user.toString() !== req.user.id) {
        return res.status(401).send("Not Allowed");
      }

      note = await Note.findByIdAndUpdate(req.params.id, { $set: newNote }, { new: true });
      res.json({ note });
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Some error occured");
    }
  })

//ROUTE 4: Delete note using PUT "/api/notes/deletenote" . Login Required
router.delete(
  "/deletenote/:id", fetchuser,
  async (req, res) => {
    const { title, description, tag } = req.body;

    //Delete  note
    //Find the note to be deleted
    try {
      let note = await Note.findById(req.params.id);
      if (!note) { return res.status(404).send("Not Found") }
      if (note.user.toString() !== req.user.id) {
        return res.status(401).send("Not Allowed");
      }

      note = await Note.findByIdAndDelete(req.params.id);
      res.json({ "Success": "Note has been deleted", "Note": note });
    } 
    catch (error) {
      console.log(error.message);
      res.status(500).send("Some error occured");
    }
  })


module.exports = router
