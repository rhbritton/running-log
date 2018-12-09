var Goal,
  goalSchema,
  mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  ObjectId = mongoose.SchemaTypes.ObjectId;

goalSchema = new Schema({
	goal: Number,
	start_date: String,
	user: { type: ObjectId, ref: 'User' }
})

module.exports = Goal = mongoose.model('Goal', goalSchema);