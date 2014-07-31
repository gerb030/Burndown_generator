var BurnDown = {
	init : function() {
		this._populate();
		this._validate();
	},
	handleChange : function(changeType) {
		switch(changeType) {
			case 'start':
				var givenDate = this._getDateFromFieldById('startdate');
				$('#startdate').datepicker('setDate', givenDate);
				
				this.handleChange('duration');
				break;
			case 'end':
				var givenDate = this._getDateFromFieldById('enddate');
				$('#enddate').datepicker('setDate', givenDate);
				break;
			case 'duration':
				var duration = parseInt($('#duration').val(), 10);
				var newDate = this._getDateFromFieldById('startdate');
				newDate.setDate(newDate.getDate()+7*duration)
				$('#enddate').val(this._formatDate(newDate));
				break;
			case 'storypoints':
				var storyPoints = parseFloat($('#storypoints').val(), 10);
				$('#storypoints').val(isNaN(storyPoints) ? 0 : storyPoints);
				break;
			case 'customtarget':
				var customTarget = parseInt($('#customtarget').val(), 10);
				$('#customtarget').val(isNaN(customTarget) ? 0 : customTarget);
				break;
			default:
				break;
		}
	},

	generate : function() {
		var startDate = this._getDateFromFieldById('startdate');
		var endDate = this._getDateFromFieldById('enddate');
		var storyPoints = parseFloat($('#storypoints').val(), 10);		
		var customTarget = parseInt($('#customtarget').val(), 10);
		var warnings = [];
		if (startDate >= endDate) {
			warnings.push('Dates are incorrectly configured');
		}
		if (storyPoints < 1) {
			warnings.push('Not enough storypoints');
		}
		if(customTarget > 100 || customTarget < 0){
			warnings.push('Custom target should be <= 100 >=0');
		}
		if (warnings.length > 0) {
			this._showWarning(warnings.join("\n"));
		} else {
			BurnDownGraph.init(document.getElementById("burndowngraph"));
			BurnDownGraph.setStartDate(startDate);
			BurnDownGraph.setEndDate(endDate);
			BurnDownGraph.setPoints(storyPoints);
			BurnDownGraph.setCustomTarget(customTarget);
			if ($('#skip_saturday').is(':checked')) {
				BurnDownGraph.addSkipWeekDay(6);
			}
			if ($('#skip_sunday').is(':checked')) {
				BurnDownGraph.addSkipWeekDay(0);
			}			
			BurnDownGraph.draw();
		}
	},

	_populate : function() {
		var today = new Date();
		if ($('#startdate').val().length != 8) {
		    $('#startdate').val(this._formatDate(today));
		}
		$('#duration').val(2); // default duration is set to two weeks
		this.handleChange('duration');
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
		this._offsetXrightMargin = 48;
		this._offsetYtopMargin = 10;
		this._target = target;
		this._target.innerHTML = "";
		this._canvas = document.createElement("canvas")
		this._canvas.id = 'graph';
		this._width = 1280;//screen.availWidth; 
		this._height = 640;//screen.availHeight; 
		this._canvas.className = 'canvasStyle';
		this._canvas.width = this._width;
		this._canvas.height = this._height;
		this._graphWidth = this._width-this._offsetXrightMargin;
		this._graphHeight = this._height-this._offsetYtopMargin;
		this._target.appendChild(this._canvas);
		this._ctx = this._canvas.getContext("2d");
		this._skipWeekDays = [];
		this._months = new Array('Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec');
		this._days = new Array('Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat');
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

	setCustomTarget : function(customtarget) {
		this._customTarget = customtarget;
	},

	addSkipWeekDay : function(weekday) {
		this._skipWeekDays.push(weekday);
	},

	draw : function() {
		var diffDays = Math.round((this._endDate - this._startDate)/(3600*1000*24));
		var yIncrement = this._getYIncremental(diffDays);
		
		this._drawGrid(diffDays);
		
		// Y axis, number of points
		var currentPoints = this._points;
		var remainder = currentPoints % yIncrement;
		displayRemainder = (remainder != 1) ? remainder : 0;
		totalDisplayPoints = currentPoints - displayRemainder + yIncrement;
		// determine divider spaces
		
		var verticalSpacing = (this._height-this._offsetY-this._offsetYtopMargin) / totalDisplayPoints;	
		var yStartPoint = this._offsetYtopMargin + verticalSpacing * (yIncrement - remainder);// (verticalSpacing*(this._points));

		currentPoints = Math.floor(currentPoints);

		var currentPointsLabel = totalDisplayPoints;
		for (var y=0;y<=Math.floor(this._points)+yIncrement;y=y+yIncrement) {
			var thisY = this._offsetYtopMargin+y*verticalSpacing;
			this._writeText(currentPointsLabel, 25, thisY+5, "12px Arial", "#202020");
			this._drawLine(this._offsetX, thisY, this._graphWidth, thisY, '#c0c0c0', 1);
			currentPointsLabel = currentPointsLabel - yIncrement;
		}

		// diagonal!
		this._drawLine(this._offsetX, yStartPoint, this._graphWidth, thisY, '#c0c0E2', 2);

		// horizontal!
		if($('#use_customtarget').is(':checked')){
			var yCustomTargetLine = this._getCustomYTargetLine();					
			var CustomTargetY = yStartPoint+(verticalSpacing*(yCustomTargetLine));
			this._drawLine(this._offsetX, CustomTargetY, this._graphWidth, CustomTargetY, '#FF0000', 2);
		}
	},
	
	_drawGrid : function(diffDays){
		var totalDays = this._createDays(diffDays);
                var displayDiffDays = totalDays.length;
		var horizontalSpacing = (this._graphWidth-this._offsetX) / displayDiffDays;

		// x axis, days duration
                for (var x=0;x<displayDiffDays;x++) {
                        var thisX = x*horizontalSpacing+this._offsetX;
                        this._drawLine(thisX, this._offsetYtopMargin, thisX, this._graphHeight-22, '#c0c0c0', 1);
                        // date
                        var labelDate = totalDays.shift();
                        var label = this._days[labelDate.getDay()]+' '+labelDate.getDate()+' '+this._months[labelDate.getMonth()];
                        this._writeText(label, thisX+horizontalSpacing-32, this._graphHeight, "12px Arial", "#202020");
                }
                var thisX = x*horizontalSpacing+this._offsetX;
                this._drawLine(thisX, this._offsetYtopMargin, thisX, this._graphHeight-22, '#c0c0c0', 1);
	},

	_drawLine : function (xFrom, yFrom, xTo, yTo, colour, width) {
		this._ctx.strokeStyle = colour;
		this._ctx.lineWidth = width;
		this._ctx.beginPath();
		this._ctx.moveTo(xFrom, yFrom);
		this._ctx.lineTo(xTo, yTo);
		this._ctx.closePath();
		this._ctx.stroke();
	},

	_writeText : function(text, x, y, fontDescription, colour) {
		this._ctx.fillStyle = colour;
	  	this._ctx.font = fontDescription;
	  	this._ctx.fillText(text, x, y);
  	},

        _getYIncremental : function() {
                return Math.ceil(this._points / 60); //might be more with a little different layout
        },

        _getCustomYTargetLine : function() {
                return (this._points / 100 ) * this._customTarget;
        },

	_createDays : function(diffDays){
		var totalDays = [];
		for (var nextDay=0;nextDay<diffDays;nextDay++) {
                        var thisDay = new Date(this._startDate.toString());
                        thisDay.setDate(thisDay.getDate() + nextDay);
                        var addDay = true;
                        for(var p in this._skipWeekDays) {
                                if (thisDay.getDay() == this._skipWeekDays[p]) {
                                        addDay = false;
					break;
                                }
                        }
                        if (addDay) {
                                totalDays.push(thisDay);
                        }                        
                }
		return totalDays;
	}
	
	
};
