/*
	UDC X/O Calendar

	Author: Brent Starks, grumpily(AT)gmail(DOT)com
	Version: 0.3.0

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

*/

(function (id0, undefined) {
	id0.wcal = {};
	var c = id0.wcal, // create shorthand reference to the (c)alendar object for use within this function
		cfg = {
			baseYr:		1988, // year from which date calculations are made - predates current 12 hour X/O schedule
			minYr:		2000, // minimum year to be calculated/displayed
			maxYr:		2100, // maximum year to be calculated/displayed
			view:		{},
			// The x/o work pattern starting with X-Squad working the 4 day weekend.
			xoDayPattern: [["x", "F"], ["x", "S"], ["x", "S"], ["x", "M"], ["o", "T"], ["o", "W"], ["o", "T"], ["x", "F$"], ["x", "S"], ["x", "S"], ["o", "M"], ["o", "T"], ["x", "W"], ["x", "T"], ["o", "F"], ["o", "S"], ["o", "S"], ["o", "M"], ["x", "T"], ["x", "W"], ["x", "T"], ["o", "F$"], ["o", "S"], ["o", "S"], ["x", "M"], ["x", "T"], ["o", "W"], ["o", "T"]],
			// See current list here: http://le.utah.gov/xcode/Title63G/Chapter1/63G-1-S301.html
			utHolidays: [
				[01, 01, "Day",      "New Year's Day"  ],  // January on 1st Day
				[01, 03, "Monday",   "Dr. MLK, Jr. Day"],  // January on 3rd Monday
				[02, 03, "Monday",   "President's Day" ],  // February on 3rd Monday
				[05, 05, "Monday",   "Memorial Day"    ],  // May on last Monday
				[07, 04, "Day",      "Independence Day"],  // July on 4th Day
				[07, 24, "Day",      "Pioneer Day"     ],  // July on 24th Day
				[09, 01, "Monday",   "Labor Day"       ],  // September on 1st Monday
				[10, 02, "Monday",   "Columbus Day"    ],  // October on 2nd Monday
				[11, 11, "Day",      "Veteran's Day"   ],  // November on 11th Day
				[11, 04, "Thursday", "Thanksgiving Day"],  // November on 4th Thursday
				[12, 25, "Day",      "Christmas Day"   ]   // December on 25th Day
			],
			// Images used in the printable part of the calendar. These are made into foreground
			// images to circumvent print default settings that remove background images/colors 
			// defeating most user's desire to print a usable version of the calendar. These are 
			// single pixel images expanded to size in the stylesheet.
			img_src_x:		'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIHWP4DwQACfsD/Qy7W+cAAAAASUVORK5CYII=',
			img_src_o:		'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWPYv3//fwAHuwM9osUBzwAAAABJRU5ErkJggg==',
			img_srcBlank:	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWNgYGD4DwABBAEAHnOcQAAAAABJRU5ErkJggg=='.replace(/[\'\"]/g,""), // hack to fix quote bug in image.
			img_srcClear:	'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
		},
		toolbar = {},
		isFirstRender = true;
	cfg.now = new Date();
	cfg.baseDate = new Date(cfg.baseYr, 0, 1);
	cfg.defaultYr = cfg.now.getFullYear();
	cfg.yrShowing = cfg.defaultYr;
	cfg.lastValidYr = cfg.defaultYr;
	// xoPattern is an array of squads/days that always starts with the squad/day 
	// associated with the first Friday (beginning the X-Squad 4 day work period) 
	// of the 28 day cycle.
	cfg.xoPattern = (function () {
		var a = [];
		for (var i = 0; i < 28; i++) a = a.concat(cfg.xoDayPattern);
		return a;
	})();


	// Since Date is the one non-clonable object and this app is intended to be a stand alone page, 
	// I have modified it for convenience. The unintended use by others makes the unlikely, but 
	// possible, breakage their problem.
	if (typeof((new Date()).isLeapYear) === "undefined") {
		Date.prototype.isLeapYear = function () {
			var y = this.getFullYear();
			return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
		};
	}
	if (typeof((new Date()).Month) === "undefined") {
		Date.prototype.Month = function (i) {
			return ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][i];
		}
	}
	if (typeof((new Date()).daysInMonth) === "undefined") {
		Date.prototype.daysInMonth = function (i) {
			return [31, (this.isLeapYear() ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][i];
		}
	}
	if (typeof((new String()).tmpl) === "undefined") {
		String.prototype.tmpl = function (json) {
			return this.replace(/\${([^{}]+)}/g, function(textMatched, key) { return json[key]; });
		}
	}

	// Convenience function to slightly mimic jQuery behaviors while keeping my 
	// utilities packaged away from app specific code.
	var $ = function (elementId) {
		var isNode = function (o){
				return ( typeof Node === "object" ? o instanceof Node : o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName==="string" );
			}, //Returns true if it is a DOM node
			isElement = function (o){
				return ( typeof HTMLElement === "object" ? o instanceof HTMLElement : o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string" );
			}, //Returns true if it is a DOM element
			elType = 'object',
			el = (function () {
				var tmp = [],
					els = {};
				if (typeof elementId === 'string') {
					els = document.querySelectorAll(elementId);
					for (var i = 0, l = els.length; i < l; i++) tmp.push(els[i]);
					if (tmp.length === 0) return;
					else if (tmp.length === 1) return tmp[0];
					else return tmp;
				}
				if (typeof elementId === 'object' && isElement(elementId)) return elementId;
				/*if (Array.isArray(elementId) || elementId instanceof Array) {
					for (var i = 0, l = elementId.length; i < l; i++) {
						tmp[tmp.length] = 
							'string' === typeof elementId[i] 
							? document.getElementById(elementId[i]) 
							: ('object' === typeof elementId[i] && isElement(elementId[i])) ? elementId[i] : null;
					}
					return tmp;
				}*/
				return;
			})();
		this.el = el;
		this.selector = elementId;
		this.id = function () { return el.getAttribute('id'); };
		this.isArray = function (obj) { return Object.prototype.toString.call( obj ) === '[object Array]'; }
		this.html = function (html) {
			if (typeof html === 'string') el.innerHTML = html; 
			return el.innerHTML;
		};
		this.forEach = function (fn) {
			var els = this.isArray(el) ? el : [].push(el);
			for (var i = 0, l = els.length; i < l; i++) fn(els[i]);
			return this;
		};
		this.template = function (templateId, data) {
			var t = typeof templateId === 'string' ? $(templateId).html() : (typeof this.id() === 'string' ? $('#' + this.id() + '_tmpl').html() : false);
			if (typeof templateId === 'object') data = templateId;
			if (t && typeof data === 'object') el.innerHTML = t.replace(/\${([^{}]+)}/g, function(textMatched, key) { return data[key]; });
			return this;
		};
		this.on = function (event, action) {
			this.forEach( function (o) { o['on' + event] = action; } ); 
			return this;
		};


		this.classList = (function () {
			var classNames = [],
				setClassNames = function () { if (el) classNames = el.getAttribute('class') ? el.getAttribute('class').split(' ') : []; };

			function list() {
				setClassNames();
				return classNames;
			} // return array
			function has(className) {
				setClassNames();
				if (!className) return classNames.length > 0 ? true : false;
				for (var i = 0, l = classNames.length; i < l; i++) if (classNames[i] === className) return true;
				return false;
			} // returns bool
			function add(className) {
				setClassNames();
				if (className && !has(className)) {
					classNames.push(className);
					el.removeAttribute('class');
					el.setAttribute('class', classNames.join(' '));
				}
				setClassNames();
				return this;
			} // retruns $
			function remove(className) {
				var classes = [];
				setClassNames();
				if (!className) el.removeAttribute('class');
				else if (has(className)) {
					if (classNames.length === 1) el.removeAttribute('class');
					else {
						for (var i = 0, l = classNames.length; i < l; i++) if (classNames[i] !== className) classes.push(classNames[i]);
						classes = classes.join(' ');
						el.removeAttribute('class');
						el.setAttribute('class', classes);
					}
				}
				setClassNames();
				return this;
			}  // returns $
			function item(i) {
				setClassNames();
				return classNames[i];
			} // returns string
			function toggle(className) {
				var isSet = false;
				setClassNames();
				// better????????? '' rather than 'block'?
				isSet = !className ? el.style.display !== 'block' : has(className);
				if (!className) el.style.display = isSet ? 'block' : 'none';
				else isSet ? remove(className) : add(className);
				return !isSet;
			} // returns bool
			function tog(className) {
				toggle(className);
				return this;
			} // returns $
			function len() {
				setClassNames();
				return classNames.length;
			} // returns number

			return {length: len, contains: has, add: add, remove: remove, toggle: toggle, list: list, has: has, tog: tog};
		})(); 

		return this;
	};


	function buildCalendarHtmlForYear(yr) {
		var date = new Date(yr, 0, 1),
			getYearLabel = function (yr) {
				var text = "";
				yr = yr.toString();
				for (var i = 0; i < yr.length; i++) { text += yr.charAt(i) + '<br />'; }
				return text + "<br /><br /><br />" + text;
			},
			data = {
				'xImg': cfg.img_src_x,
				'oImg': cfg.img_src_o,
				'blankImg': cfg.img_srcBlank,
				'yr': yr,
				//'yearLabel': '<span class="wcal_vertical">${yr}</span><br /><br /><br /><span class="wcal_vertical">${yr}</span>'.tmpl({'yr': yr}),
				'yearLabel': getYearLabel(yr),
				'monthLabel': 'January',
				'xo': 'x',
				'img': this.xImg,
				'day': ''
			},
			pIndex = 0,
			limit = 0,
			days = [],
			months = [],
			// offset determines how many cells/days must be removed (the offset) to make 
			// the xoPattern array align properly with the first day of the year.
			// 86400000 = milliseconds/day					
			offset = Math.floor(Math.floor((date.getTime() - (cfg.baseDate).getTime()) / 86400000)  % cfg.xoDayPattern.length),
			xoPattern = cfg.xoPattern.slice(offset, cfg.xoPattern.length),
			getData = function (newData) { for (var key in newData) data[key] = newData[key] };

		for (var month = 0; month < 12; month++) { // For each month
			data.monthLabel = date.Month(month);
			months[month] = '<tr>'; // Each month starts in a new row.
			if (month === 0) // If Jan, add year cell to the first position in the months array.
				months[month] += '<td rowspan="12" class="wcal_year" id="wcal_yrLabel1">${yearLabel}</td>'.tmpl(data);
			// Add month cell before starting to add days to the array.
			months[month] += '<td class="wcal_month">${monthLabel}</td>'.tmpl(data);
			limit = date.daysInMonth(month); // Limit applying xo styles to the number of days in a month.
			for (var day = 0; day < 31; day++) { // For each day in current month array
				if (day < limit) { // Add template with xo styles if within day limit.
					getData({xo: xoPattern[pIndex][0], img: 'x' === xoPattern[pIndex][0] ? data.xImg : data.oImg, day: xoPattern[pIndex][1]})
					days[day] = '<td class="wcal_${xo}"><div class="wcal_xo"><div><img alt="" src="${img}" /></div><div class="wcal_con">${day}</div></div></td>'.tmpl(data);
					pIndex++;
				} else { // Else add template styled for blank days.
					data.img = data.blankImg;
					days[day] = '<td class="wcal_blank"><div class="wcal_xo"><div><img alt="" src="${img}" /></div></div></td>'.tmpl(data);
				}
			}
			// Assemble days cells into an html string, add the row ending, and add to the current position in the months array.
			months[month] += days.join('') + '</tr>';
		}
		return months.join(''); // Assemble months array into html string for the year's calendar and return it.
	}

	function renderCalendarHtml(yr) {
		var daysBar = '<tr class="wcal_daysBar">' +
			'<td colspan="2"></td>' +
			'<td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td><td>8</td><td>9</td><td>10</td>' +
			'<td>11</td><td>12</td><td>13</td><td>14</td><td>15</td><td>16</td><td>17</td><td>18</td><td>19</td><td>20</td>' +
			'<td>21</td><td>22</td><td>23</td><td>24</td><td>25</td><td>26</td><td>27</td><td>28</td><td>29</td><td>30</td><td>31</td>' +
			'</tr>';
		return daysBar + buildCalendarHtmlForYear(yr) + daysBar + buildCalendarHtmlForYear(yr + 1) + daysBar;
	}

	function renderHolidayTableContents(yr) {
		var holidays = cfg.utHolidays,
			html = "",
			getDate = function (holiday, year) {
				var adjDate = { "Sunday": [6, 0, 1, 2, 3, 4, 5], "Monday": [5, 6, 0, 1, 2, 3, 4], "Tuesday": [4, 5, 6, 0, 1, 2, 3], "Wednesday": [3, 4, 5, 6, 0, 1, 2], "Thursday": [2, 3, 4, 5, 6, 0, 1], "Friday": [1, 2, 3, 4, 5, 6, 0], "Saturday": [0, 1, 2, 3, 4, 5, 6] },
					dayStr = '',
					adjHoliday = null,
					holidayDate = 0,
					day = holiday[2],
					date = holiday[1],
					month = holiday[0] - 1,
					objDate = new Date(yr, month, 1),
					weekday = objDate.getDay();
				// For holidays that are specified for specific dates (e.g. Christmas: Dec. 25),
				// identify adjustments for actual days off.
				if (day === "Day") {
					weekday = (new Date('' + holiday[0] + '-' + holiday[1] + '-' + year)).getDay();
					// Grab month name and date to be displayed.
					dayStr = objDate.Month(month) + ' ' + date;
					// If the day is on Sunday, adjust the holiday date forward to Monday. Else if on Saturday, adjust back to Friday.
					// Conforms to state law regarding holidays that land on the weekend.
					if (weekday === 0) adjHoliday = date + 1;
					else if (weekday === 6) adjHoliday = date - 1;
					// Return holiday date if no adjustment was needed.
					if (adjHoliday === null) return dayStr;
					// Else correct for rare adjusted holiday date that falls outside of the month 
					// (e.g. Jan 1 falls on Saturday, day off roll back to December 1.).
					if (adjHoliday === 0) { // For holidays on the first day of the month....
						month = (month === 0) ? 11 : month - 1;
						adjHoliday = objDate.daysInMonth(month);
					// For the possibility of holidays being created on the last day of the month....
					} else if (adjHoliday > objDate.daysInMonth(month)) {
						month = (month === 11) ? 0 : month + 1;
						adjHoliday = 1;
					}
					// Return the holiday date plus the adjusted date.
					return dayStr += ' (' + objDate.Month(month).substr(0, 3) + ' ' + adjHoliday + ')';
				}
				// Calculate dates for holidays that are on a specified day of the week (e.g. Thursday for Thanksgiving)
				// Here, 'date' is actually the count of weekdays (e.g. 3 for the third Monday which President's Day falls 
				// on) and will never be greater than 5 which means the last occurance of that weekday in the month.
				holidayDate = (7 * date) - adjDate[day][weekday];
				return objDate.Month(month) + ' ' + ((holidayDate > objDate.daysInMonth(month)) ? holidayDate - 7 : holidayDate);
			};

		for (var i = 0, len = holidays.length; i < len; i++) {
			html += '<tr><td>${holidayName}</td><td>${date1}</td><td class="wcal_empty">&nbsp;</td><td>${holidayName}</td><td>${date2}</td></tr>'
				.tmpl({holidayName: holidays[i][3], date1: getDate(holidays[i], yr), date2: getDate(holidays[i], yr + 1)});
		}
		return html;
	}

	function isValidYr(yr) { // Is yr a number and within range?
		var inputYr;
		if (!document.getElementById('wcal_input')) inputYr = yr;
		else inputYr = +document.getElementById('wcal_input').value;
		if (typeof(inputYr) === 'number' && typeof(yr) === 'number' && !(yr > cfg.maxYr) && !(yr < cfg.minYr)) {
			if (inputYr === yr && yr !== cfg.lastValidYr) cfg.lastValidYr = yr; // if submitting from text box, update last
			cfg.yrShowing = yr;
			return yr; // return a valid year
		} // If yr is not valid, alert of error, reset last valid year, and return false.
		alert('The requested year (' + yr + ') is not a number in the range of ' + cfg.minYr + ' to ' + cfg.maxYr + '.');
		document.getElementById('wcal_input').value = cfg.lastValidYr;
		return false;
	}
	
	function renderPage(yr) {
		var data = {};
		yr = isValidYr(+yr);
		if (yr === false) return;
		
		data = {
			yr1: yr,
			yr2: yr + 1,
			title: '' + yr + ' &amp; ' + (yr + 1) + ' Work Schedule',
			calendar: renderCalendarHtml(yr),
			holidays: renderHolidayTableContents(yr),
			xImg: cfg.img_src_x,
			oImg: cfg.img_src_o
		};
		if (isFirstRender) {
			// Render the toolbar and footer for only the first call.
			isFirstRender = false;
			$('#wcal_calendar').template({'yr': yr});
		}
		// Render the calendar, assigned holidays, and holiday lists on all calls.
		$('#wcal_printArea').template(data);
	};

	toolbar = {
		cmd: {
			"print": function () { window.print(); },
			"help": function (whichCal) { $('#wcal_helpBox').classList.toggle(); },
			"previous": function () { renderPage(cfg.yrShowing - 2); },
			"now": function () { renderPage(cfg.defaultYr); },
			"next": function () { renderPage(cfg.yrShowing + 2); },
			"gotoCal": function (yr) { renderPage(yr); },
			// show|hide table response to selected option in View dropdown
			"newView": function (el) { document.getElementById(el.value).style.display = (el.checked ? 'table' : 'none'); }
		},
		behaviors: {
			'init': function () {
				$('.wcal_view').forEach(function (el) { 
					// Set on click/change for Views dropdown menu, process new view request
					el.onchange = function () { id0.wcal.newView(el); }; 
					// Set default checkbox check state
					'wcal_view3' === el.getAttribute('id') ? el.removeAttribute("checked") : el.setAttribute("checked", "checked");
					// Ensure View1 (calendar) is disabled so it will always be displayed
					if ('wcal_view1' === el.getAttribute('id')) el.disabled = 'disabled';
					// Use newView to show/hide page tables based on the above default settings
					c.newView({ "value": el.value, "checked": ((el.getAttribute("checked")) ? true : false) });
				});
				// On mouseover/click (show View menu), change arrow to point up
				/*$('.wcal_dropdown_arrow').forEach(function (el) { // fix!!!
					el.onmouseover = $(el).classList.add('wcal_active');
					el.onmouseout = $(el).classList.remove('wcal_active');
				});*/
				//$('.wcal_ddcontainer')
				//	.on('mouseover', function () { alert(2);$('#wcal_dropdown_arrow').classList.add('wcal_active'); })
				//	.on('mouseout', function () { $('#wcal_dropdown_arrow').classList.remove('wcal_active'); })
			}
		}
	}
	// These are the functions called from the toolbar
	c.tb = toolbar.cmd;
	c.newView = toolbar.cmd.newView;

	function init() {
		renderPage(+cfg.defaultYr);
		toolbar.behaviors.init();
		//document.getElementById('shows').innerHTML = document.getElementsByTagName('body')[0].innerHTML;
	}


	window.onload = function () {
		init();
	};

})(window.id0 = window.id0 || {});

