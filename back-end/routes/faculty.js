// GET faculty's classes
router.get('/api/faculty/classes/:id', async (req, res) => {
  try {
    const facultyId = req.params.id;
    const classes = await Class.find({ faculty: facultyId })
      .select('className subject description students createdAt')
      .sort({ createdAt: -1 });

    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ message: 'Error fetching classes', error: error.message });
  }
});

// Create class route (if not already implemented)
router.post('/api/faculty/classes', async (req, res) => {
  try {
    const { className, subject, description, facultyId } = req.body;
    
    const newClass = new Class({
      className,
      subject,
      description,
      faculty: facultyId,
      students: []
    });

    await newClass.save();
    res.status(201).json(newClass);
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ message: 'Error creating class', error: error.message });
  }
}); 