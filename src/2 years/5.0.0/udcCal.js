/*jshint esversion: 6 */

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

*/

(function (id0, undefined) {
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
			img_src_x:		'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIHWP4DwQACfsD/Qy7W+cAAAAASUVORK5CYII=',
			img_src_o:		'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWPYv3//fwAHuwM9osUBzwAAAABJRU5ErkJggg==',
			img_srcBlank:	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWNgYGD4DwABBAEAHnOcQAAAAABJRU5ErkJggg==',
			img_srcClear:	'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
		};
	cfg.now = new Date();
	cfg.baseDate = new Date(cfg.baseYr, 0, 1);
	cfg.defaultYr = cfg.now.getFullYear();
	cfg.yrShowing = cfg.defaultYr;
	cfg.lastValidYr = cfg.defaultYr;

	if (typeof((new Date()).isLeapYear) === "undefined") {
		Date.prototype.isLeapYear = function () {
			var y = this.getFullYear();
			return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
		};
	}

	function buildCalendarHtmlForYear(yr) {
		var date = [new Date(yr, 0, 1), new Date(yr + 1, 0, 1)],
			xoDayPattern = [["x", "F"], ["x", "S"], ["x", "S"], ["x", "M"], ["o", "T"], ["o", "W"], ["o", "T"], ["x", "F$"], ["x", "S"], ["x", "S"], ["o", "M"], ["o", "T"], ["x", "W"], ["x", "T"], ["o", "F"], ["o", "S"], ["o", "S"], ["o", "M"], ["x", "T"], ["x", "W"], ["x", "T"], ["o", "F$"], ["o", "S"], ["o", "S"], ["x", "M"], ["x", "T"], ["o", "W"], ["o", "T"]],
			month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
			daysInMonth = [31, ((new Date(yr, 0, 1)).isLeapYear() ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
			img_x = cfg.img_src_x,
			img_o = cfg.img_src_o,
			img_blank = cfg.img_srcBlank.replace(/[\'\"]/g,""),
			pIndex = 0,
			limit = 0,
			days = [],
			months = [],
			// classxoPattern is an array of squads/days that always starts with the squad/day 
			// associated with the first Friday (beginning the X-Squad 4 day work period) 
			// of the 28 day cycle.
			xoPattern = (function () {
				var a = [];
				for (var i = 0; i < 28; i++) a = a.concat(xoDayPattern);
				return a;
			})(),
			// offset determines how many cells must be removed (the offset) to make 
			// the xoPattern array align properly with the first day of the year.
			// 86400000 = milliseconds/day					
			offset = Math.floor(Math.floor(((date[0]).getTime() - (cfg.baseDate).getTime()) / 86400000)  % xoDayPattern.length),
			getYearLabel = function (yr) {
				var text = "";
				yr = yr.toString();
				for (var j = 0; j < yr.length; j++) { text += yr.charAt(j) + '<br />'; }
				return text + "<br /><br /><br />" + text;
			};

		xoPattern = xoPattern.slice(offset, xoPattern.length);
		for (let m = 0; m < 12; m++) { // For each month
			if (m === 0) months[m] = `
							<tr>
								<td rowspan="12" class="wcal_year" id="wcal_yrLabel1">${getYearLabel(yr)}</td>
								<td class="wcal_month">${month[m]}</td>`;
			else months[m] = `
							<tr>
								<td class="wcal_month">${month[m]}</td>`;
			limit = daysInMonth[m];
			for (let d = 0; d < 31; d++) { // For each day in current month array
				if (d < limit) {
					let [xo, day] = xoPattern[pIndex];
					days[d] = `
								<td class="wcal_${xo}"><div class="wcal_xo"><div><img alt="" src="${xo === "x" ? img_x : img_o}" /></div><div class="wcal_con">${day}</div></div></td>`;
					pIndex++;
				} else {
					days[d] = `
								<td class="wcal_blank"><div class="wcal_xo"><div><img alt="" src="${img_blank}" /></div></div></td>`;
				}
			}
			months[m] += days.join('') + `
							</tr>`;
		}
		return months.join('');
	}

	function renderCalendarHtml(yr) {
		var daysBar = `
							<tr class="wcal_daysBar">
								<td colspan="2"></td>
								<td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td><td>8</td><td>9</td><td>10</td>
								<td>11</td><td>12</td><td>13</td><td>14</td><td>15</td><td>16</td><td>17</td><td>18</td><td>19</td><td>20</td>
								<td>21</td><td>22</td><td>23</td><td>24</td><td>25</td><td>26</td><td>27</td><td>28</td><td>29</td><td>30</td><td>31</td>
							</tr>`;
		document.getElementById('wcal_body').innerHTML = daysBar + buildCalendarHtmlForYear(yr) + daysBar + buildCalendarHtmlForYear(yr + 1) + daysBar;
	}

	function renderHolidayTableContents(yr) {
		var utHolidays = cfg.utHolidays,
			uh = [],
			html = "",
			adjDate = { "Sunday": [6, 0, 1, 2, 3, 4, 5], "Monday": [5, 6, 0, 1, 2, 3, 4], "Tuesday": [4, 5, 6, 0, 1, 2, 3], "Wednesday": [3, 4, 5, 6, 0, 1, 2], "Thursday": [2, 3, 4, 5, 6, 0, 1], "Friday": [1, 2, 3, 4, 5, 6, 0], "Saturday": [0, 1, 2, 3, 4, 5, 6] },
			dayVal = { "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6 },
			month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
			getDate = function (holiday, year) {
				var day = holiday[2],
					wday = null,
					dayStr = '',
					adjHoliday = null,
					mo = uh[0] - 1,
					hdate = 0,
					daysInMonth = [31, ((new Date(year, 0, 1)).isLeapYear() ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
				// For holidays that are specified for specific dates (e.g. Christmas: Dec. 25),
				// identify adjustments for actual days off.
				if (day === "Day") {
					wday = (new Date(`${holiday[0]}-${holiday[1]}-${year}`)).getDay();
					dayStr = month[mo] + ' ' + holiday[1];
					// if day is on Saturday or Sunday, adjust holiday date forward or back to Monday or Friday
					if (wday === 0) adjHoliday = holiday[1] + 1;
					else if (wday === 6) adjHoliday = holiday[1] - 1;
					// Return holiday date if no adjustment was needed
					if (adjHoliday === null) return dayStr;
					// Else correct for rare adjusted holiday date that falls outside of the month (e.g. Jan 1 falls on Sat)
					if (adjHoliday === 0) {
						mo = (mo === 0) ? 11 : mo - 1;
						adjHoliday = daysInMonth[mo];
					} else if (adjHoliday > daysInMonth[mo]) {
						mo = (mo === 11) ? 0 : mo + 1;
						adjHoliday = 1;
					}
					return dayStr += ` (${month[mo].substr(0, 3)} ${adjHoliday})`;
				}
				// calculate dates for holidays that are on a specified day of the week (e.g. Thanksgiving)
				wday = (new Date(`${holiday[0]}-1-${year}`)).getDay();
				hdate = (7 * +holiday[1]) - adjDate[day][wday];
				return month[mo] + ' ' + ((hdate > daysInMonth[mo]) ? hdate - 7 : hdate);
			};

		for (var i = 0, len = utHolidays.length; i < len; i++) {
			uh = utHolidays[i];
			html += `
					<tr>
						<td>${uh[3]}</td>
						<td>${getDate(uh, yr)}</td>
						<td class="wcal_empty">&nbsp;</td>
						<td>${uh[3]}</td>
						<td>${getDate(uh, yr + 1)}</td>
					</tr>`;
		}
		document.querySelector('#wcal_holidays tbody').innerHTML = html;
	}

	function isValidYr(yr) { // Is yr a number and within range?
		var inputYr;
		if (!document.getElementById('wcal_input')) inputYr = yr;
		else inputYr = +document.getElementById('wcal_input').value;
		if (typeof(inputYr) === 'number' && typeof(yr) === 'number' && !(yr > cfg.maxYr) && !(yr < cfg.minYr)) {
			if (inputYr === yr && yr !== cfg.lastValidYr) cfg.lastValidYr = yr; // if submitting from text box, update last
			cfg.yrShowing = yr;
			return yr; // return a valid year
		} // If yr is not, alert of error, reset last valid year, and return false.
		alert(`The requested year (${yr}) is not a number in the range of ${cfg.minYr} to ${cfg.maxYr}.`);
		document.getElementById('wcal_input').value = cfg.lastValidYr;
		return false;
	}

	function toggle(el) {
		if (typeof el === 'string') el = document.getElementById(el);
		el.style.display = (el.style.display !== 'block' ? 'block' : 'none');
	}

	function toggleClass(el, className) {
		if (typeof el === 'string') el = document.getElementById(el);
		el.classList.toggle(className);
	}

	c.tb = { // These are the functions called from the toolbar
		"print": function () { window.print(); },
		"help": function (whichCal) { toggle('wcal_helpBox'); },
		"previous": function () { renderPage(cfg.yrShowing - 2); },
		"now": function () { renderPage(cfg.defaultYr); },
		"next": function () { renderPage(cfg.yrShowing + 2); },
		"gotoCal": function (yr) { renderPage(yr); }
	};
	c.newView = function (el) { 
		// show|hide table response to selected option in View dropdown
		document.getElementById(el.value).style.display = (el.checked ? 'table' : 'none');
	};

	function renderPage(yr) {
		yr = isValidYr(+yr);
		if (yr === false) return;
		document.getElementById('wcal_title').innerHTML = `${yr} &amp; ${(yr + 1)} Work Schedule`;
		renderCalendarHtml(yr);
		// Insert year labels into Assigned Holidays table
		document.getElementById('wcal_yrLabels1').innerHTML = yr;
		document.getElementById('wcal_yrLabels2').innerHTML = (yr + 1);
		// Insert year labels and holiday dates into Utah's State-Recognized Holidays table
		document.getElementById('wcal_yrLabela1').innerHTML = yr;
		document.getElementById('wcal_yrLabela2').innerHTML = (yr + 1);
		renderHolidayTableContents(yr);
	};

	function main() {
		Array.from(document.querySelectorAll('.wcal_img_x'), el => el.src = cfg.img_src_x );
		Array.from(document.querySelectorAll('.wcal_img_o'), el => el.src = cfg.img_src_o );
		document.getElementById('wcal_input').value = cfg.defaultYr;
		renderPage(+cfg.defaultYr);
		// Toolbar settings below this point
		Array.from(document.querySelectorAll('.wcal_view'), el => el.setAttribute("checked", "checked") );
		Array.from(document.querySelectorAll('.wcal_view'), el => el.onchange = function () { id0.wcal.newView(this); } );
		document.getElementById('wcal_view1').onchange = function () { this.checked = "checked"; };
		document.getElementById('wcal_view3').removeAttribute("checked");
		for (var i = 1; i < 4; i++) 
			c.newView({ "value": document.getElementById('wcal_view' + i).value, "checked": ((document.getElementById('wcal_view' + i).getAttribute("checked")) ? true : false) });
		Array.from(document.querySelectorAll('.wcal_dropdown_arrow'), el => { // fix!!!
			el.onmouseover = el.classList.add('wcal_active');
			el.onmouseout = el.classList.remove('wcal_active');
		} );
		document.getElementById('wcal_dropdown_arrow').onmouseover = function () { toggleClass(document.getElementById('wcal_dropdown_arrow'), 'wcal_active') }
	}


	//	main();
	window.onload = function () {
		main();
	};

})(window.id0 = window.id0 || {});

