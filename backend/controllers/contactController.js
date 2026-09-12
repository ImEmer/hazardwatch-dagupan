import ContactMessage from '../models/ContactMessage.js';

export const submitMessage = async (req, res, next) => {
  try {
    const message = await ContactMessage.create(req.body);
    res.status(201).json({ success: true, message });
  } catch (error) { next(error); }
};

export const getMessages = async (req, res, next) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json({ success: true, messages });
  } catch (error) { next(error); }
};

export const updateMessageStatus = async (req, res, next) => {
  try {
    const message = await ContactMessage.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
    if (!message) return res.status(404).json({ success: false, message: 'Contact message not found.' });
    res.json({ success: true, message });
  } catch (error) { next(error); }
};
