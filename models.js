var mongoose = require('mongoose');

var schema = mongoose.Schema({
		date: {	month: Number, quarter: Number, year: Number },
		url:				String,
		report	:			[],
		avgAvailability:	Number,
		avgTimeIdle:		[],
		duration:			Number,
		leastQuarterly:		{type:	Boolean, default: false}
	});

exports.Reports = mongoose.model("Report", schema);
