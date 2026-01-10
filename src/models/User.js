import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Optional for Google users
    googleId: { type: String },
    avatar: { type: String },
    createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);
