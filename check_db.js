import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const historySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    topic: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
});

const History = mongoose.model('History', historySchema);
const User = mongoose.model('User', userSchema);

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/study_hub');
        console.log("Connected");

        const lastUser = await User.findOne().sort({ _id: -1 });
        console.log("Last User:", lastUser?.username, lastUser?._id);

        const count = await History.countDocuments();
        console.log(`Total History items: ${count}`);

        const items = await History.find().sort({ timestamp: -1 }).limit(5);
        items.forEach(item => {
            console.log(`- Topic: ${item.topic}, User: ${item.userId}`);
        });

        await mongoose.disconnect();
    } catch (err) { console.error(err); }
}
check();
