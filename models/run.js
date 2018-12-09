var Run,
  runSchema,
  mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  ObjectId = mongoose.SchemaTypes.ObjectId;

runSchema = new Schema({
	date: Date,
	miles: Number,
	seconds: Number,
	rpe: Number,
	comment: String,
	user: { type: ObjectId, ref: 'User' }
})

module.exports = Run = mongoose.model('Run', runSchema);