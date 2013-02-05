var BurnDown = {
	init : function() {
		this._populate();
		this._validate();
	},
	handleDateChange : function(changeType) {
		switch(changeType) {
			case 'start':
				var givenDate = this._getDateFromFieldById('startdate');
				$('#startdate').val(this._formatDate(givenDate));
				this.handleDateChange('duration');
				break;
			case 'end':
				var givenDate = this._getDateFromFieldById('enddate');
				$('#enddate').val(this._formatDate(givenDate));
				break;
			case 'duration':
				var duration = parseInt($('#duration').val(), 10);
				var newDate = this._getDateFromFieldById('startdate');
				newDate.setDate(newDate.getDate()+7*duration)
				$('#enddate').val(this._formatDate(newDate));
				break;
			case 'storypoints':
				var storyPoints = parseInt($('#storypoints').val(), 10);
				$('#storypoints').val(isNaN(storyPoints) ? 0 : storyPoints);
				break;
			default:
				break;
		}
	},
	generate : function() {
		var startDate = this._getDateFromFieldById('startdate');
		var endDate = this._getDateFromFieldById('enddate');
		var storyPoints = parseInt($('#storypoints').val(), 10);
		var warnings = [];
		if (startDate >= endDate) {
			warnings.push('Dates are incorrectly configured');
		}
		if (storyPoints < 1) {
			warnings.push('Not enough storypoints');
		}
		if (warnings.length > 0) {
			this._showWarning(warnings.join("\n"));
		} else {
			BurnDownGraph.init(document.getElementById("burndowngraph"));
			BurnDownGraph.setStartDate(startDate);
			BurnDownGraph.setEndDate(endDate);
			BurnDownGraph.setPoints(storyPoints);
			if ($('#skip_saturday').is(':checked')) {
				BurnDownGraph.addSkipWeekDay(6);
			}
			if ($('#skip_sunday').is(':checked')) {
				BurnDownGraph.addSkipWeekDay(0);
			}
			BurnDownGraph.draw();
		}
	},
	_generateGraph : function() {
		
	},
	_populate : function() {
		var today = new Date();
		if ($('#startdate').val().length != 8) {
			$('#startdate').val(this._formatDate(today));
		}
		$('#duration').val(2); // default duration is set to two weeks
		this.handleDateChange('duration');
	},
	_validate : function() {
		var start = $('#startdate').val();
	},
	_getDateFromFieldById : function(id) {
		var values = $('#'+id).val().split("-");
		var y = parseInt(values[0], 10);
		var m = parseInt(values[1], 10)-1;
		var d = parseInt(values[2], 10);
		return new Date(y, m, d, 0, 0, 0, 0);
	},
	_formatDate : function(dateObject) {
		var month = (dateObject.getMonth()+1);
		var day = (dateObject.getDate());
		return dateObject.getFullYear()+'-'+(month < 10 ? '0' : '')+month+'-'+(day < 10 ? '0' : '')+day;
	},
	_showWarning : function(warningText) {
		alert(warningText);
	}
};
var BurnDownGraph = {
	init : function(target) {
		this._offsetX = 48;
		this._offsetY = 32;
		this._target = target;
		this._target.innerHTML = "";
		this._canvas = document.createElement("canvas")
		this._canvas.id = 'graph';
		this._width = 1024;//screen.availWidth; 
		this._height = 640;//screen.availHeight; 
		this._canvas.className = 'canvasStyle';
		this._canvas.width = this._width;
		this._canvas.height = this._height;
		this._target.appendChild(this._canvas);
		this._ctx = this._canvas.getContext("2d");
		this._skipWeekDays = [];
	},
	setStartDate : function(startDate) {
		this._startDate = startDate;
	},
	setEndDate : function(endDate) {
		this._endDate = endDate;
	},
	setPoints : function(points) {
		this._points = points;
	},
	addSkipWeekDay : function(weekday) {
		this._skipWeekDays.push(weekday);
	},
	_getDayLabel : function(dayInt) {
		switch(dayInt) {
			case 0:
				return 'Sun';
			case 1:
				return 'Mon';
			case 2:
				return 'Tue';
			case 3:
				return 'Wed';
			case 4:
				return 'Thu';
			case 5:
				return 'Fri';
			case 6:
			default:
				return 'Sat';
		}
	},
	_getMonthLabel : function(monthInt) {
		switch(monthInt) {
			case 0:
				return 'Jan';
			case 1:
				return 'Feb';
			case 2:
				return 'Mar';
			case 3:
				return 'Apr';
			case 4:
				return 'May';
			case 5:
				return 'Jun';
			case 6:
				return 'Jul';
			case 7:
				return 'Aug';
			case 8:
				return 'Sep';
			case 9:
				return 'Oct';
			case 10:
				return 'Nov';
			case 11:
			default:
				return 'Dec';
		}
	},
	draw : function() {
		var totalDays = [];
		var diffDays = Math.round((this._endDate - this._startDate)/(3600*1000*24));
		for (var d=0;d<diffDays;d++) {
			var thisDay = new Date();
			thisDay.setDate(this._endDate.getDate() - d);
			console.log(thisDay);
			for(var p in this._skipWeekDays) {
				if (thisDay.getDay() == this._skipWeekDays[p]) {
					console.log('NOT IN LIST');
					diffDays--;
				} else {
					totalDays.push(thisDay);	
				}
			}
		}
		var horizontalSpacing = (this._width-this._offsetX) / diffDays;
		// x axis, days duration
		var thisDate = new Date();
		for (var x=0;x<=diffDays;x++) {
			var thisX = x*horizontalSpacing+this._offsetX;
			this._drawLine(thisX, 0, thisX, this._height-this._offsetY, '#c0c0c0', 1);
			// date
			var labelDate = totalDays.pop();
			var label = this._getDayLabel(labelDate.getDay())+' '+labelDate.getDate()+' '+this._getMonthLabel(labelDate.getMonth());
			this._writeText(label, thisX, this._height-this._offsetY+14, "12px Arial", "#202020");
		}
		// Y axis, days number of points
		var verticalSpacing = (this._height-this._offsetY) / this._points;
		var currentPoints = this._points;
		for (var y=0;y<=this._points;y++) {
			var thisY = y*verticalSpacing;
			this._drawLine(this._offsetX, thisY, this._width, thisY, '#c0c0c0', 1);
			this._writeText(currentPoints, 32, thisY+9, "12px Arial", "#202020");
			currentPoints--;
		}
		this._drawLine(this._offsetX, 0, this._width, this._height-this._offsetY, '#c0c0E2', 1);
		console.log("-- draw done --");
	},
	_drawLine : function (xFrom, yFrom, xTo, yTo, colour, width) {
		this._ctx.strokeStyle = colour;
		this._ctx.lineWidth = width;
		this._ctx.beginPath();
		this._ctx.moveTo(xFrom, yFrom);
		this._ctx.lineTo(xTo, yTo);
		this._ctx.stroke();
	},
	_writeText : function(text, x, y, fontDescription, colour) {
		this._ctx.fillStyle = colour;
	  	this._ctx.font = fontDescription;
	  	this._ctx.fillText(text, x, y);
  	} 
};