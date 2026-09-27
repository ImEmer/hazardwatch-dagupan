import mongoose from 'mongoose';
import Report from '../models/Report.js';
import User from '../models/User.js';

const syncTextIndex = async (model) => {
  const desiredTextIndex = model.schema.indexes().find(([keys]) => Object.values(keys).includes('text'))?.[0];
  if (!desiredTextIndex) return;
  const indexes = await model.collection.indexes().catch((error) => {
    if (error.codeName === 'NamespaceNotFound') return [];
    throw error;
  });
  const currentTextIndex = indexes.find((index) => index.weights);
  const desiredFields = Object.keys(desiredTextIndex).sort();
  const currentFields = Object.keys(currentTextIndex?.weights || {}).sort();
  if (currentTextIndex && JSON.stringify(currentFields) !== JSON.stringify(desiredFields)) {
    await model.collection.dropIndex(currentTextIndex.name);
  }
  await model.createIndexes();
};

export const connectDB = async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not configured.');
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([syncTextIndex(Report), syncTextIndex(User)]);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
};
