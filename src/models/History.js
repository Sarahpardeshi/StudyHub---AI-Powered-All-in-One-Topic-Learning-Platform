import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    topic: { type: String, required: true },
    content: { type: String },
    suggestions: [{ type: String }],
    chatMessages: { type: Array, default: [] },
    flashcards: { type: Array, default: [] },
    quizzes: { type: Array, default: [] },
    timestamp: { type: Date, default: Date.now }
});

export const History = mongoose.model('History', historySchema);
