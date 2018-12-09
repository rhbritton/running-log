var User,
  userSchema,
  mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  ObjectId = mongoose.SchemaTypes.ObjectId;

userSchema = new Schema({
	email: String,
	password: String,
	friends: [{ type: ObjectId, ref: 'User' }],
	requestsReceived: [{ type: ObjectId, ref: 'User' }],
	requestsSent: [{ type: ObjectId, ref: 'User' }]
})

module.exports = User = mongoose.model('User', userSchema);