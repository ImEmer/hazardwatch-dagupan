import User from '../models/User.js';

const fields = 'name email role barangay phone isActive lastLogin profileImage createdAt';
export const getUsers = async (req, res, next) => { try { const users = await User.find().select(fields).sort({ createdAt: -1 }); res.json({ success: true, users }); } catch (e) { next(e); } };
export const getUser = async (req, res, next) => { try { const user = await User.findById(req.params.id).select(fields); if (!user) return res.status(404).json({ success: false, message: 'User not found.' }); res.json({ success: true, user }); } catch (e) { next(e); } };
export const createUser = async (req, res, next) => { try { const user = await User.create(req.body); res.status(201).json({ success: true, user: user.toJSON() }); } catch (e) { next(e); } };
export const updateUser = async (req, res, next) => { try { const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).select(fields); res.json({ success: true, user }); } catch (e) { next(e); } };
export const toggleUserStatus = async (req, res, next) => { try { const user = await User.findById(req.params.id); user.isActive = !user.isActive; await user.save(); res.json({ success: true, user: user.toJSON() }); } catch (e) { next(e); } };
export const deleteUser = async (req, res, next) => { try { await User.findByIdAndDelete(req.params.id); res.json({ success: true, message: 'User deleted.' }); } catch (e) { next(e); } };
