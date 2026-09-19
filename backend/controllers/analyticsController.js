import mongoose from 'mongoose';

const COLLECTIONS = {
  reportsPerBarangay: 'analytics_reports_per_barangay',
  reportsPerCategory: 'analytics_reports_per_category',
  reportsPerPriority: 'analytics_reports_per_priority',
  reportsPerDay: 'analytics_reports_per_day',
  tumblingHourly: 'analytics_tumbling_hourly',
  slidingWindows: 'analytics_sliding_1h_10m',
  sessionWindows: 'analytics_session_30m',
};

const readCollection = (collectionName) => async (req, res, next) => {
  try {
    const data = await mongoose.connection.db.collection(collectionName).find({}).sort({ count: -1, date: 1 }).toArray();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getReportsPerBarangay = readCollection(COLLECTIONS.reportsPerBarangay);
export const getReportsPerCategory = readCollection(COLLECTIONS.reportsPerCategory);
export const getReportsPerPriority = readCollection(COLLECTIONS.reportsPerPriority);
export const getReportsPerDay = readCollection(COLLECTIONS.reportsPerDay);
export const getTumblingHourly = readCollection(COLLECTIONS.tumblingHourly);
export const getSlidingWindows = readCollection(COLLECTIONS.slidingWindows);
export const getSessionWindows = readCollection(COLLECTIONS.sessionWindows);
