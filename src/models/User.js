import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Remove pre-save hook since password is already hashed in auth routes
// userSchema.pre('save', async function(next) {
//   if (this.isModified('passwordHash')) {
//     this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
//   }
//   next();
// });

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

export default mongoose.model('User', userSchema);