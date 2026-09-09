import User from '../models/User.js';

const fields = 'name email role barangay phone isActive lastLogin profileImage createdAt';

const enforceUserManagementRules = (actor, targetUser, nextRole = null) => {
  if (actor.role === 'superadmin') return true;
  if (actor.role !== 'admin') return false;
  if (targetUser?.role === 'superadmin') return false;
  if (nextRole === 'superadmin') return false;
  return true;
};

export const getUsers = async (req, res, next) => { try { const users = await User.find().select(fields).sort({ createdAt: -1 }); res.json({ success: true, users }); } catch (e) { next(e); } };
export const getUser = async (req, res, next) => { try { const user = await User.findById(req.params.id).select(fields); if (!user) return res.status(404).json({ success: false, message: 'User not found.' }); res.json({ success: true, user }); } catch (e) { next(e); } };
export const createUser = async (req, res, next) => { try { const user = await User.create(req.body); res.status(201).json({ success: true, user: user.toJSON() }); } catch (e) { next(e); } };
export const updateUser = async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found.' });

    const nextRole = req.body.role;
    if (!enforceUserManagementRules(req.user, targetUser, nextRole)) {
      return res.status(403).json({ success: false, message: 'You are not allowed to modify this user.' });
    }

    const payload = { ...req.body };
    if (req.user.role === 'admin') {
      delete payload.role;
    }

    const user = await User.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true }).select(fields);
    res.json({ success: true, user });
  } catch (e) {
    next(e);
  }
};
export const toggleUserStatus = async (req, res, next) => { try { const user = await User.findById(req.params.id); if (!user) return res.status(404).json({ success: false, message: 'User not found.' }); if (req.user.role === 'admin' && user.role === 'superadmin') return res.status(403).json({ success: false, message: 'You are not allowed to modify this user.' }); user.isActive = !user.isActive; await user.save(); res.json({ success: true, user: user.toJSON() }); } catch (e) { next(e); } };
export const deleteUser = async (req, res, next) => { try { const userToDelete = await User.findById(req.params.id); if (!userToDelete) return res.status(404).json({ success: false, message: 'User not found.' }); if (!enforceUserManagementRules(req.user, userToDelete)) return res.status(403).json({ success: false, message: 'You are not allowed to delete this user.' }); await User.findByIdAndDelete(req.params.id); res.json({ success: true, message: 'User deleted.' }); } catch (e) { next(e); } };
