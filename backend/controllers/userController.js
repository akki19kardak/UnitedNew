import User from "../models/User.js";

// Fetch profile, and if it's their first time logging in, auto-create their MongoDB document
export const getUserProfile = async (req, res) => {
  try {
    let user = await User.findOne({ uid: req.user.uid });
    
    if (!user) {
      user = new User({
        uid: req.user.uid,
        email: req.user.email || "no-email@provided.com",
        name: req.user.name || "New User"
      });
      await user.save();
    }
    
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const updates = req.body;
    
    // Security: prevent users from changing their own ID or making themselves admins
    delete updates.role;
    delete updates.uid;
    updates.updatedAt = Date.now();

    const updatedUser = await User.findOneAndUpdate(
      { uid: req.user.uid },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
