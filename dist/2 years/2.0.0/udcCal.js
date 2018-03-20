
/*
	UDC X/O Calendar
	
	Author: Brent Starks, grumpily(AT)gmail(DOT)com
	Additional formats and options may be found at http://id0.org/cucf/ or by 
	contacting Brent Starks (or his successor) from the above email or site.
	
	This code may be freely used by Utah employees or contractors for creating 
	calendar applications for the Department of Corrections' staff.
	
	id0 is a global object created to support the calendar funtionality. 
	The following self-executing, anonymous function offers conflict-free 
	containment of the calendar code by encapsulating the variables and functions
	to prevent namespace conflicts when inserted into another page. 
	
	"wcal_" is used to prefix id and class names in an effort to avoid style 
	and behavior conflicts.

	View/Edit with tab = 4 spaces
	This code dependant on jQuery for $(), $().addClass(), $().removeClass(), 
	$().html, $().attr(), $().ready().
	
*/

(function (id0, $, undefined) {
	if ($ === null) return alert("The X/O Calendar requires jQuery to function. Please email bstarks@utah.gov to report this issue.");
	id0.wcal = {};
	var c = id0.wcal, // create shorthand reference to the (c)alendar object for use within this function
		cfg = {
			baseYr:		1988, // year from which date calculations are made - predates current 12 hour X/O schedule
			minYr:		2000, // minimum year to be calculated/displayed
			maxYr:		2100, // maximum year to be calculated/displayed
			view:		{},
			// The x/o work pattern with "wcal_x08" and "wcal_o22" being paydays
			// This is 1 list of class names that will be assigned to the table below.
			xoPattern:	["wcal_x01", "wcal_x02", "wcal_x03", "wcal_x04", "wcal_o05", "wcal_o06", "wcal_o07", "wcal_x08", "wcal_x09", "wcal_x10", "wcal_o11", "wcal_o12", "wcal_x13", "wcal_x14", "wcal_o15", "wcal_o16", "wcal_o17", "wcal_o18", "wcal_x19", "wcal_x20", "wcal_x21", "wcal_o22", "wcal_o23", "wcal_o24", "wcal_x25", "wcal_x26", "wcal_o27", "wcal_o28"],
			dayPattern:	["F", "S", "S", "M", "T", "W", "T", "F$", "S", "S", "M", "T", "W", "T", "F", "S", "S", "M", "T", "W", "T", "F$", "S", "S", "M", "T", "W", "T"],
			utHolidays: [
				[01, 01, "Day",      "New Year's Day"  ],  // January on 1st Day
				[01, 03, "Monday",   "Dr. MLK, Jr. Day"],  // January on 3rd Monday
				[02, 03, "Monday",   "President's Day" ],  // February on 3rd Monday
				[05, 04, "Monday",   "Memorial Day"    ],  // May on 4th Monday
				[07, 04, "Day",      "Independence Day"],  // July on 4th Day
				[07, 24, "Day",      "Pioneer Day"     ],  // July on 24th Day
				[09, 01, "Monday",   "Labor Day"       ],  // September on 1st Monday
				[10, 02, "Monday",   "Columbus Day"    ],  // October on 2nd Monday
				[11, 11, "Day",      "Veteran's Day"   ],  // November on 11th Day
				[11, 04, "Thursday", "Thanksgiving Day"],  // November on 4th Thursday
				[12, 25, "Day",      "Christmas Day"   ]   // December on 25th Day
			],
			img_srcODays:	"",
			img_srcXDays:	"",
			img_srcBlank:	"",
			img_srcClear:	"",
		};
	cfg.now = new Date();
	cfg.baseDate = new Date(cfg.baseYr, 0, 1);
	cfg.defaultYr = cfg.now.getFullYear();
	cfg.yrShowing = cfg.defaultYr;
	cfg.lastValidYr = cfg.defaultYr;
	cfg.xoClassList = (function () {
		var a = [];
		for (var i = 0; i < 28; i++) a = a.concat(cfg.xoPattern);
		return a;
	})();

	if (typeof((new Date()).isLeapYear) === "undefined") {
		Date.prototype.isLeapYear = function () {
			var y = this.getFullYear();
			return (y % 4 == 0 && y % 100 != 0) || y % 400 == 0;
		}
	}

	function getDateIdList(yr) { // build list of table cell IDs
		var days = [];
		function getAnnualIdList(which, year, days) {
			var daysInMonth = [31, ((new Date(year, 0, 1)).isLeapYear() ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
			for (var m = 1; m < 13; m++) { for (var d = 1; d <= daysInMonth[m - 1]; d++) days.push("d" + which + "_" + m + "_" + d); }
		}
		getAnnualIdList(1, yr, days);
		getAnnualIdList(2, yr + 1, days);
		return days;
	}

	function getYearLabel(iYear) {
		var text = "";
		iYear = iYear.toString();
		for (var j = 0; j < iYear.length; j++) { text += iYear.charAt(j) + '<br />'; }
		return text + "<br /><br /><br />" + text;
	}

	function setDaysNClasses(yr) {
		var date = [new Date(yr, 0, 1), new Date(yr + 1, 0, 1)],
			// classList is an array of classes that always starts with the class 
			// associated with the first Friday (beginning the X-Squad 4 day work period) 
			// of the 28 day cycle. "offset" determines how many cells must be removed 
			// (the offset) to make the classList array align properly with the first
			// day of the year.
			// 86400000 = milliseconds/day
			offset = Math.floor(Math.floor(((date[0]).getTime() - (cfg.baseDate).getTime()) / 86400000)  % cfg.xoPattern.length), 
			classList = cfg.xoClassList.slice(offset, cfg.xoClassList.length),
			dateIdList = getDateIdList(yr),
			isODay = false,
			html_imgXDays = '<div class="wcal_xo"><div><img alt="" src="' + cfg.img_srcXDays + '" /></div><div class="wcal_con">{{contents}}</div></div>',
			html_imgODays = '<div class="wcal_xo"><div><img alt="" src="' + cfg.img_srcODays + '" /></div><div class="wcal_con">{{contents}}</div></div>',
			html_imgBlank = '<div class="wcal_xo"><div><img alt="" src="' + cfg.img_srcBlank + '" /></div>',
			className = "";
		// for each day cell, set class and cell contents
		for (var i = 0; i < dateIdList.length; i++) {
			className = classList[i];
			isODay = "wcal_o" === className.substr(0,6);
			$("#" + dateIdList[i]).removeClass().addClass(className + (isODay ? " wcal_o" : " wcal_x"))
			.html( (isODay ? html_imgODays : html_imgXDays).replace(/\{\{contents\}\}/g, cfg.dayPattern[+className.substr(6, className.length) - 1]) );
		}
		// set class and contents for leap years and blanks
		for (i = 0; i < 2; ++i) if (!date[i].isLeapYear()) $("#d" + (i + 1) + "_2_29").removeClass().addClass("wcal_blank");
		$(".wcal_blank").html( html_imgBlank );
	}

	function getHolidayTableContents(yr) {
		var utHolidays = cfg.utHolidays,
			len = utHolidays.length,
			uh = [],
			html = "",
			adjDate = { "Sunday": [6, 0, 1, 2, 3, 4, 5], "Monday": [5, 6, 0, 1, 2, 3, 4], "Tuesday": [4, 5, 6, 0, 1, 2, 3], "Wednesday": [3, 4, 5, 6, 0, 1, 2], "Thursday": [2, 3, 4, 5, 6, 0, 1], "Friday": [1, 2, 3, 4, 5, 6, 0], "Saturday": [0, 1, 2, 3, 4, 5, 6] },
			dayVal = { "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6 },
			month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
		function getDate (holiday, year) {
			var day = holiday[2];
			if (day === "Day") return holiday[1];
			return (7 * +holiday[1]) - adjDate[day][(new Date(+holiday[0] + "-1-" + year)).getDay()];
		}
		for (var i = 0; i < len; i++) {//
			uh = utHolidays[i];
			html += '<tr><td>' + uh[3] + '</td><td>' + month[+uh[0] - 1] + ' ' + 
				getDate(uh, yr) + '</td> <td class="wcal_empty">&nbsp;</td> <td>' + 
				uh[3] + '</td><td>' + month[+uh[0] - 1] + ' ' + getDate(uh, yr + 1) + 
				"</td></tr>\n";
		}
		return html;
	};

	function isValidYr(yr) { // Is yr a number and within range?
		var inputYr = +$('#' + 'wcal_input').attr('value');
		if (!isNaN(inputYr) && !isNaN(yr) && !(yr > cfg.maxYr) && !(yr < cfg.minYr)) {
			if (inputYr === yr && yr !== cfg.lastValidYr) cfg.lastValidYr = yr; // if submitting from text box, update last
			cfg.yrShowing = yr;
			return yr; // return a valid year
		} // If yr is not, alert of error, reset last valid year, and return false.
		alert("The requested year (" + yr + ") is not a number in the range of " + cfg.minYr + " to " + cfg.maxYr + ".");
		$('#' + 'wcal_input').attr('value', cfg.lastValidYr);
		return false;
	}

	c.tb = { // These are the functions called from the toolbar
		"print": function () { window.print(); },
		"help": function (whichCal) { $("#wcal_helpBox").toggle(); },
		"previous": function () { c.renderPage(cfg.yrShowing - 2); },
		"now": function () { c.renderPage(cfg.defaultYr) },
		"next": function () { c.renderPage(cfg.yrShowing + 2) },
		"gotoCal": function (yr) { c.renderPage(yr) }
	};
	c.newView = function (el) { 
		// show|hide table response to selected option in View dropdown
		(el.checked) ? $("#" + el.value).css("display", "table") : $("#" + el.value).css("display", "none");
	}

	function DropDown(el) {
		this.dd = el;
		this.opts = this.dd.find('ul.wcal_dropdown > li');
		this.val = [];
		this.index = [];
		this.initEvents();
	}
	DropDown.prototype = {
		initEvents: function () {
			var obj = this;

			obj.dd.on('click', function (event) { // prob in attachment to button
				$(this).toggleClass('active'); // prefix class name with wcal_
				event.stopPropagation();
			});

			obj.opts.children('label').on('click', function (event) {
				var opt = $(this).parent(),
					chbox = opt.children('input'),
					val = chbox.val(),
					idx = opt.index();

				($.inArray(val, obj.val) !== -1) ? obj.val.splice($.inArray(val, obj.val), 1) : obj.val.push(val);
				($.inArray(idx, obj.index) !== -1) ? obj.index.splice($.inArray(idx, obj.index), 1) : obj.index.push(idx);
			});
		},
		getValue: function () {
			return this.val;
		},
		getIndex: function () {
			return this.index;
		}
	}

	function getBgImgsFromCss() {
		// Take background images from CSS to make forground images which
		// bypasses problem where printer settings ignore background images.
		// These are placed in cfg properties for script insertion in the calendars.
		var idPart = "";
		$(".wcal_hiddenImg").each ( function() {
			idPart = $(this).attr('id').replace(/wcal_sec_img/, "");
			cfg["img_src" + idPart] = $("#wcal_sec_img" + idPart).css("background-image").replace(/^url\(/, "").replace(/\)$/, "");
		});
	}

	c.renderPage = function (yr) {
		yr = isValidYr(+yr);
		if (yr === false) return;
		$("#wcal_title").html(yr + " &amp; " + (yr + 1) + " Work Schedule");
		$("#wcal_yrLabel1").html(getYearLabel(yr));
		$("#wcal_yrLabel2").html(getYearLabel(yr + 1));
		$("#wcal_yrLabels1").html((yr));
		$("#wcal_yrLabels2").html((yr + 1));
		$("#wcal_yrLabela1").html((yr));
		$("#wcal_yrLabela2").html((yr + 1));
		setDaysNClasses(yr);
		$("#wcal_holidays tbody").html(getHolidayTableContents(yr));
	};

	function main() {
		getBgImgsFromCss();
		$(".wcal_legendCell .wcal_o img").attr( "src", cfg.img_srcODays );
		$(".wcal_legendCell .wcal_x img").attr( "src", cfg.img_srcXDays );
		$("#wcal_sched .wcal_o img").attr( "src", cfg.img_srcODays );
		$("#wcal_input").attr("value", cfg.defaultYr);
		c.renderPage(+cfg.defaultYr);
		$(".wcal_view").attr("checked", "checked");
		$(".wcal_view").attr("onchange", 'id0.wcal.newView(this)');
		$("#wcal_view1").attr("onchange", 'this.checked="checked"');
		$("#wcal_view3").removeAttr("checked");
		for (var i = 1; i < 4; i++) {
			if ($("#wcal_view" + i).attr("checked")) c.newView({ "value": $("#wcal_view" + i).val(), "checked": true });
			else c.newView({ "value": $("#wcal_view" + i).val(), "checked": false });
		}
		var dd = new DropDown($('#wcal_dd'));
		$(document).click(function () {
			// all dropdowns
			$('.wrapper-dropdown-4').removeClass('active');
		});
		$(".wcal_blank").html(cfg.html_imgBlank);
	}


	//	main();
	$(document).ready(function () {
		main();
	});
	
	
})(window.id0 = window.id0 || {}, (typeof (jQuery) === "function" ? jQuery : null));


