var User,
  userSchema,
  mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  ObjectId = mongoose.SchemaTypes.ObjectId;

userSchema = new Schema({
	email: String,
	password: String
})

module.exports = User = mongoose.model('User', userSchema);