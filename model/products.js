var mongoose = require('mongoose');
var blobSchema = new mongoose.Schema({
  name: String,
  type: Number,
  created: { type: Date, default: Date.now },
  available: Boolean
});
mongoose.model('Product', blobSchema);
