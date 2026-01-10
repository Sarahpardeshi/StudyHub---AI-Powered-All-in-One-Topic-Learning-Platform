import mongoose from 'mongoose';

const libraryItemSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['video', 'book', 'note', 'source'], required: true },
    title: { type: String, required: true },
    category: { type: String, required: true }, // [NEW] e.g., "Machine Learning"
    data: { type: Object, required: true },
    createdAt: { type: Date, default: Date.now }
});

export const LibraryItem = mongoose.model('LibraryItem', libraryItemSchema);
