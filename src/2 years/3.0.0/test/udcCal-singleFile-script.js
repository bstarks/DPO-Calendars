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
	cfg.templates = {'style': '', 'calendar': ''}

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

	function getCalendarHtml(yr) {
		var daysBar = `
							<tr class="wcal_daysBar">
								<td colspan="2"></td>
								<td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td><td>8</td><td>9</td><td>10</td>
								<td>11</td><td>12</td><td>13</td><td>14</td><td>15</td><td>16</td><td>17</td><td>18</td><td>19</td><td>20</td>
								<td>21</td><td>22</td><td>23</td><td>24</td><td>25</td><td>26</td><td>27</td><td>28</td><td>29</td><td>30</td><td>31</td>
							</tr>`;
		return daysBar + buildCalendarHtmlForYear(yr) + daysBar + buildCalendarHtmlForYear(yr + 1) + daysBar;
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
		document.getElementById('wcal_page').innerHTML = getPageHtml(yr);
	}
	
	function getPageHtml(yr) {
		yr = isValidYr(+yr);
		if (yr === false) return;
		return `
			<div id="wcal_printArea">
				<div id="wcal_container">
					<table id="wcal_table" class="wcal_tables">
						<thead>
							<tr>
								<td colspan="33" class="wcal_legendCell">
									<h1 id="wcal_title">${yr} &amp; ${(yr + 1)} Work Schedule</h1>

									<span class="wcal_headLeft">X-Squad Works</span>
									<span class="wcal_headCenter">Paydays</span>
									<span class="wcal_headRight">O-Squad Works</span>
									<br />

									<div class="wcal_headLeft">
										<div class="wcal_xo wcal_x">
											<div><img id="oImg" alt="" src="${cfg.img_src_x}" /></div>
										</div>
									</div>
									<div class="wcal_headCenter">
										<div class="wcal_xo wcal_o">
											<div><img alt="" src="${cfg.img_src_o}" /></div>
											<div>F$</div>
										</div>
										&nbsp;or&nbsp;
										<div class="wcal_xo wcal_x">
											<div><img alt="" src="${cfg.img_src_x}" /></div>
											<div>F$</div>
										</div>
									</div>
									<div class="wcal_headRight">
										<div class="wcal_xo wcal_o">
											<div><img alt="" src="${cfg.img_src_o}" /></div>
										</div>
									</div>
								</td>
							</tr>
						</thead>
						<tbody id="wcal_body">
${getCalendarHtml(yr)}
						</tbody>
					</table>
				</div>


				<div id="wcal_schedContainer">
					<table id="wcal_sched" class="wcal_tables">
						<tr>
							<td rowspan="2">
								<div class="wcal_xo wcal_o">
									<div><img alt="" src="${cfg.img_src_o}" /></div>
									<div><span>Assigned<br />Holidays</span></div>
								</div>
							</td>
							<td>
								<div class="wcal_xo wcal_o">
									<div><img alt="" src="${cfg.img_src_o}" /></div>
									<div><span id="wcal_yrLabela1">${yr}</span></div>
								</div>
							</td>
							<td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
						</tr>
						<tr>
							<td>
								<div class="wcal_xo wcal_o">
									<div><img alt="" src="${cfg.img_src_o}" /></div>
									<div><span id="wcal_yrLabela2">${(yr + 1)}</span></div>
								</div>
							</td>
							<td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
						</tr>
					</table>
				</div>


				<table id="wcal_holidays" class="wcal_tables">
					<thead>
						<tr>
							<th colspan="5" class="wcal_title">Utah's State-Recognized Holidays</th>
						</tr>
						<tr>
							<th colspan="2" id="wcal_yrLabels1">${yr}</th>
							<th> </th>
							<th colspan="2" id="wcal_yrLabels2">${(yr + 1)}</th>
						</tr>
					</thead>
					<tbody>
${renderHolidayTableContents(yr)}
					</tbody>
				</table>
			</div>`;
	};

	function main() {
		alert(0)
		document.getElementById('wcal_calendar').innerHTML = `

<style>

/* =====  Media/Printer Settings  ======================================== */

@media print {
	.wcal_header, #wcal_footer { display: none; }
}


/* =====  HTML Tag Settings  ============================================= */

#wcal_calendar {
	text-align			: center;
	margin      		: 0;
	padding     		: 0;
	font-family			: Arial;
	font-size   		: 10px;
	background-color	: white;
}
#wcal_calendar h1 {
	text-align			: center;
	font-size			: 16px;
}

#wcal_printArea {
	display				: inline-block;
	margin      		: 0;
	padding     		: 0;
	width				: 100%;
	max-width			: 6.5in;
	min-width			: 6.5in;
	height				: 9in;
	font				: inherit;
	text-align			: center;
	z-index				: 10;
}

.wcal_title {
	text-align			: center;
	font-size			: 16px;
}

/* =====  Top Button Bar  ================================================= */
.wcal_header  {
	padding				: 5px 0 2px 0;
	margin				: 0;
	margin-bottom		: 10px;
	background			: buttonface;
	border-bottom		: 1px outset;
	min-width			: 6.5in;
	text-align			: center;
}

.wcal_header ul {
	margin				: 0;
}

.wcal_header button  {
	background-repeat	: no-repeat; 
	height				: 30px; 
	vertical-align		: middle; 
	font-size			: 12px;
	background-color	: #e9e9e9;
	border				: 1px solid #a0a0a0;
}

#wcal_input {
	width				: 33px;
	height				: 20px;
	padding				: 4px 4px;
	text-align			: center;
	vertical-align		: middle;
	border				: 1px solid ButtonShadow;
	border-right		: 0;
}


/* =====  Drop Down Menu  ================================================= */

/* Checkbox Menus */

.wcal_dropdown {
	/* Size and position */
	position			: relative;
	display				: inline-block;
	margin				: 0 auto;
	padding				: 0;
	padding-right		: 18px;
	height				: 20px; 
}
.wcal_dropdown span {
	display				: hidden;
}
.wcal_dropdown span#wcal_dropdown_arrow:before { /* down arrow */
	content				: "";
	width				: auto;
	height				: 0;
	position			: absolute;
	right				: 5px;
	top					: 50%;
	margin-top			: -3px;
	border-width		: 4px 4px 0 4px;
	border-style		: solid;
	border-color		: black transparent;
}

.wcal_dropdown span#wcal_dropdown_arrow.wcal_active:before {
	border-width		: 0 4px 4px 4px; /* up arrow -- see script */
}

/* END Checkbox Menus */

.wcal_nav_separator {
	font-size			: 22px;
}

#wcal_nav_wrap {
	margin				: 0;
	margin-top			: -5px;
	margin-left			: -35px;
	padding				: 0;
	z-index				: 1000000000;
	position			: relative;
	display				: inline-block;
}

#wcal_nav_wrap li {
	list-style			: none;
	position			: relative;
	display				: inline-block;
	margin				: 0;
	padding				: 0;
}

#wcal_nav_wrap ul li {
	display				: block;
	color				: #333;
	text-decoration		: none;
	font-weight			: 700;
	font-size			: 12px;
	line-height			: 32px;
	padding				: 0 15px;
	font-family			: "HelveticaNeue","Helvetica Neue",Helvetica,Arial,sans-serif;
}

#wcal_nav_wrap ul li {
	position			: relative;
	display				: inline-block;
	margin				: 0;
	padding				: 0;
}

#wcal_nav_wrap ul li.current-menu-item {
	background			: #ddd;
}

/*
#wcal_nav_wrap ul li:hover {
	background			: #f6f6f6;
}
*/

#wcal_nav_wrap ul ul {
	display				: none;
	position			: absolute;
	top					: 100%;
	left				: 0;
	background			: #e9e9e9;
	border				: 1px solid #a0a0a0;
	padding				: 0;
}

#wcal_nav_wrap ul ul li:hover {
	background			: #f6f6f6;
}

#wcal_nav_wrap ul ul li {
	float				: none;
	width				: 200px;
	text-align			: left;
}

#wcal_nav_wrap ul ul a {
	line-height			: 120%;
	padding				: 10px 15px;
}

#wcal_nav_wrap ul ul ul {
	top					: 0;
	left				: 100%;
}

#wcal_nav_wrap ul li:hover > ul {
	display				: block;
}



/*
	Styling the Toolbar Buttons

	Base64 Encoded Images 
	Online encoder: http://webcodertools.com/imagetobase64converter
	The following are the page's images stored internally as text to avoid 
	the loss of resources when the file is moved around or when it is 
	manipulated in other sites. To change the images, replace the existing 
	image with its encoded replacement. Note: page images may also be 
	encoded into image elements in the HTML.
*/
.wcal_btns {
	background-repeat	: no-repeat;
	background-origin	: border-box;
	background-size		: 20px 20px;
	padding-left		: 28px;
	background-position	: 5px center;
}
.wcal_btnImgPrint		{ background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAABF1BMVEUAAAD8/PzIyMjm5uaTk5O0tLRERERJSUnQ0NDi4uLz8/OmpqbIyMicnJ1YWFi2trYeHh43NzdgYGDQ0NB+fn6yvc2amprMzMyPj4+7u7u5ubmysrKwsLCfn5/Hx8esrKylpaXCwsK6urq6urplZWVpaWm+vr7R0dEbGxvExMQzMzPv7+/Y2Ni0w9hbgLSvr6/V1dW/v7/R0dHs7OyZmZnt7e3o6Oji4uLa2trLy8t1j7Pq6urk5OTf39/MzMzc3NzX19fOzs7GxsaPj4/x8fHO1+Pd3d2nudOzvs6ot8uWqMKOpMJ7mMC6u7t8lLZfhLagoKCVlZWAgIC+vr6JnryEmrlliLlri7ikqbGQna+jo6M8PDw7OzsULCOGAAAAK3RSTlMAAkT+ptyCexULBALm/nZWOzElGAf9+fPt6+vVz8W5ramlkYd0clAwMCwe0e6L3AAAAQ5JREFUGNNNz9d2gkAQgOFZgSBgj+m9l91EAqEYmoK9a3p5/+fILhjJd/mfmT07wNxkliRI8bpjulbHtg+XFVG8YwR2Q7Vt50RGVFx5AxNV1bSmaZ4iGtgs8BhbltexLS/YpREYFkkjHiU7LCXrOiYkzlYuWZczxQMTuxyHWy2Mt4pXbPas/ZFX1Trl+742/ty4RCDnut3BYPjyOpk8MaPhEYDkjd6m0/vU+z5A1m3fpXr9fk9AkOVwyrECtSkArP+LBucRrS4gFrXoMTGPokUtFNibePbjG4ahM+b3ItwD+iVsfo0f/syfw2NER8ulbbKyWbqW2O3Kbb62Misr7HalWjkviOIaJYqFi0pVgV83RjbPz3IxSwAAAABJRU5ErkJggg==); }
.wcal_btnImgGoToYr		{ background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAAAulBMVEUAAAD+/v6Pj49ra2uqqqrJ1rcAAADBwsEAAACpx4a/zqnL17nS3cPm7N4BAQG0z5WlvYSxxZa1yJq5y6DB0K3Y4csAAADj6tr1+PGw0ImpyYamwYGjwnqhwHmYsnesxoinv4Z6mk2nv4ahuX+swY+4yqBsgFKftoDC0a1VYkIHCgLY4cu/3Zq62pe12I2625O42Y7M5K/H4KnC36XF4aPA3qC93JqtyonQ5bbE2qW/2aK815q12JKr04PS5SsbAAAALHRSTlMAAgUHAk4kBBTzVDswEAr5qoF2X0EkHBgI/fv18e3p5cehmYt0ZmRiTEIsKnd/OjcAAAC8SURBVBjTjZDXDsMgDEWbFJqdrqzuvbNn5///Vk0soSrqQy7IMnAult1pL+GP8Nago5FqCCxngbHudvZIcn++rxlYIGsz1m+HlR+HOzijDLs22UoUTjTGoR0fh4AOmuX1VxQvPEg4qVOqVmVUnSjV+Mfu+p6kfhCEb0Xj9o43SPOiDD6K9VtIGj6zIpieG32O+1lf5YUEQiQRdFkeJYI+0jVl2ekxXR1ZNk2CIHDdWqIIKNpbDBRJPjDYGL6Ndw18NxBzPwAAAABJRU5ErkJggg==); }
.wcal_btnImgPrevious	{ background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAAA7VBMVEUAAAD39/ejo6ORrmqdtnsAAAAvLy+PrWiguX8AAABSUlKMqWO/zqnt8uhSUlKcuHeMqWXY4csAAADr8OUAAAAPDw9/f3+mw4Cdv3Ghvn+TtGmNsF6QrmmPrmh4m0eNq2aIqF6DpVR3mUmHplqSrm2MqGWVr3Gbs3igt4C6yqPV38jU3sXk6tv3+PT19/I0NDTR5ry93KDG4K3I4rHB3qTD36mdzGWkz3SZyVuNxEew1Y2Vx1Wy1pCv1Yar0oGizW2JwT6FvzTC36G62pu22JOp0nvV6MPN37nN5LPK47LI4q/F4KeixnKgx22SxlDxX27+AAAAMHRSTlMAAgTquSMP38MWC6ZHDAfvtiYcEQ8KBv399/Hv39/f2dnTycfDwY9+dFAqKhoGBASFAyO9AAAA4UlEQVQY02WQ57KCMBBGE24TROze3u+1F1CkCQL2/v6P42YTHGY8k/zImf12Z0Mu0CK5olf/TxVwyoV1hiYI2/nUVxlK0DBJ4Kr5zVbP33KyFDs0H2ez/U4X3LB4LntwrOXCHI44THZ/Q9c9gTaGHJC5DzuKI3di2VNjjICk6qsTxyg9w2SwOCl+OxGX3twAcBBMOk4cyw5831+Axkpo0XgKw+D5gfH+9pNs1HoJvPSaYOG2v0xYE3MpyoW/1CsJ9FXxIXikmqYo94iiaDWJyUG1IsulO6Qky5WqRkVeEvBWZ/C5H05k9UrfAAAAAElFTkSuQmCC); }
.wcal_btnImgCurrent		{ background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAAA6lBMVEUAAAD9/f3Z4s2tra1cXFz09vC1tbWTsmy+zamctXkAAAAAAAAAAAB7e3vAz6vr7+T09/CowoePsGSSrmuUr26rv43b5NAEBAQfHx+avGygvX2TtmaMrWCZtXWMrF6IqFuKqWCSrW6SrmuXsHM5RyS+zak9SC3F0rHT3cTf5tTK47PH4a7D36mxypTB3qaw1YuezGeWyFfB2ae+3KGu1IXF4Kqk0HWZyV2PxEqHwDrR57u916G605+725252pa115S22ZOy1pCm0Heizm6Ux1OMw0Pa6snV6MLI4q3C36K20JWsz4CdxGmDvjEG7J3rAAAAKnRSTlMAAiQECgQC60yiJB0UBUIOB/zrzqtpIAwI+/nv6OfZx7uhn5FSSkQ8KhztNqjhAAAA6UlEQVQY012QB47CMBBFcYrZbBodtld6MQ6p9N65/3WYTCCReJIlz9N8f8kpJFN9QgySShCylmWNRuOcHM0kROi22p3eYJKWcQT7IEHALpybnKZlmKJ3Y7kAGZHEZwzkQ3zGWLJpKEph3HIWtm2/KsqPgJtmfrsbOvOl6y7Z3CqACyl9DPcHtw+sWN68F9WzztTjnHurXCkpKh7ttb/x1y/GvSjk7+RvguBcJAha+KbvfnDxfgnmYsxPzr8y8XgLNN7em3jHJKGirkuS9F+TAF2k4QO0UtY0VX0GVFXTyhWdRHlKRYRSrL4CcIgb5f9CP2IAAAAASUVORK5CYII=); }
.wcal_btnImgNext		{ background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAAA81BMVEUAAAD9/f3BwcGLqmP09vCUr3AAAAAmJiZmZmby9e7u8umeunobGxsvLy+NqWavyZGgu3yatneVs26Qq2mkuoW9zKfL17oAAADk6tsAAABXV1coKCj09/GowomhvH+VuWSStWN1mEaMrl+PrmVrjzmNq2R5mkuJqF2Oq2aGo1yYsXWgt4CtwZLb5NDg59bS573H4K3K47HE4Km93KCNw0XA3aWw1Iu625uz15Ko0Xmjz3LD36Oey2WbymOYyVuUx1Sq0oCfzWiSxk6HwTqEvzPO5bfH4q3B16m42Zi00JS22I+r0oKq0oGpy3ugzW2cwGuawmOxS6IWAAAAL3RSTlMAAgLWDqkhDQQKBvsTEaL8+/PzqXJHNRoYFgkIBPv7+/Xv6+Xjz8/Lx5WJdlwiHnp4ILAAAADsSURBVBjTZZCHcsIwDIZll9ZOmoQyyu7ek0DThJAQ9p7v/zTIcXxwx2edTvpPHr9BQUpwSu35+tCQBD2TzqtaqaBn6lNLExWGZp3H5G7GDfu9BAQXpG7rCZNmEDwVQJC6akjsYOGH/ftvPAFFW+L5/WjgDLafNZy8bMZ4q3an6wyHzvqDoPgv8NyeEEej8O1XTP4hM1eKzs7SQIpeC3HbYRTd5eU7X88kaX/jPyqrymZ26b78KJsgEtrMznMaiOoI/eHrqFf/UsAclyIo5xXGTNMwTJOxCueUAOVVZpSLFzHFssGqnCb7aYK8eg+1cB81z4hvBgAAAABJRU5ErkJggg==); }
.wcal_btnImgShow		{ background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAABpFBMVEUAAAD////e3t7q6ur09PQAAABvb2+gprESEhKTk5PKztUJCQnb29tkZGTOzs6GipS5v8cgISIkJCaanJ8/QEcYGBi1trkZGRoDAwPPz9AAAAAtLS3s7Oy5vcV/hZCQk5k/QEG/xM1hYWFTU1OiqLFmZmZYWFlFRkd/gYS5v8i1usRkZGS4ur68vsFvcn5jaHDCx8+Nk5yJjI9+f4AtLjDDxMiRlp1QUVGrrrJydYKXmJpQUFBUV2BHR0g+Pj5bXWMlJSaIjZRHSVEpKSm2t7k7Ozw+QEd1d3mKjZNERk0gICHa3OHBw8XIycujpKcODg/Y2t0oKCjPz8/r7e+enp/d3d4jIyNISEjf39/19vfFytKaoa93e4fO0tm9w8y4v8m2vMiytbuVnKpfX2BHSEnLz9bBx8+yusWwt8K7vcC3ub2jqrWtr7OVmKGKjp6Ag5J7fH5ucnpzdHc3ODrp6+7j5urc4OXZ3OHR1dzHzNTCx8/Cxs69wMSss76qsLywsbSoq7GbpLGfo6uanqmOkZd9gYuBhYpydYFpbHZPT1AyMzQkJCZWVdOCAAAAWnRSTlMAAgQGAikT/iUO/jwfGgj+9tPDuJBvYmAxLywfC/39+fn39fXx7+/v7evr6eXh4eHb2dnV09HPz8vLycO/u7Ovr6uhn52XgXx6enhycmhmVko4NC4uKCQcFBDgFu1nAAABOUlEQVQY02VQ1XbDMBSLw2WGtR0zMzMzc5JyytyOmfGn5zjZXib7PljHks4VpgDH/oEYad/3zJX9vQEA2nVt/kzddtpPABkSa+GMl9fPmYfI0JodMvBCu9YXX+rjXRCEJ65cC0mUMW7wv45ZZzpyuQyj+AJLXTwwSbGU02rI8t12vSQnm/yB2AABSBW7kA0x/AZS1xffYrdbMBQ/GA49Fhaln8RoTZgJtOxCI2KZ5zsPUTjlGkxHfcbVY4xYYvjQtEcKonU9F141F63uao7fpYSKIyCxO+FEshj0Rrgrn7/wbcLRnnsN4dpPMXnuDQbVlSYNCZDeMaFZaUyc3JdKN5xDhSGQbkrHzubTvVNfYp/utyZcj+HzYtWmy2zW6OVC4EBs22y0ykkpYiCDZt0koOVGEQsHHpSKdD8CZDjScMkKEQAAAABJRU5ErkJggg==); }
.wcal_btnImgHelp		{ background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAABPlBMVEUAAAD4+PjQz8/DcmrWxMPAIx6xHxarHxWtKyC3QjiyPjW5Vk28XlU1BQDNjIXhubXr0M0AAADs1dIAAAADAwMhISGpEwu1HxefEAinGRCbEQizKB+oIxm1SD90GA++Zl3BbmZ0IxvGe3PHfnbGe3PQk40oAwAjAwDWoZves64KAQAGAADs09Cqn57hTEzcPT3mX1+0Dw/kV1fiVFTgSEiyDQ2sEAzu09DcXVviW1ntU1PrTk7nSkrjpaPsc3PpaGjoZWXXODbSLy/FIx+5FRW3ExL47u336+ry2tjotbLmrKrejIngeXbqbm3nYmLlVFLfRETcOTnaMzPXMC/KKSfEHx/79vX05uXy4d/rv7zqvLnourfinJnbhIDpeXjiY2LmXFveT07XR0XlRUXXRELgQkLeQkLVPT3KJCPDJyFgkNp7AAAALnRSTlMAAgR3EP7t4dG8t52Vd18wHBgXEgwG+fXz6enf162XiYOBdnJsYFpURjgoJB4MOubfzwAAARJJREFUGNONkMWSg0AURUMg7jburkAjwSFAiLuMu8///8B0N5ldFjmbrj5176t6L7A4xBxmNkvG1iOx/TwySAbgQy7buqrqdjiNfv6ExERT+4rSV7VfcqaIA1d7aV5LUv2O1UInfp0Kj/TbhqwockMS3qNBnEy7ww+p3bOsXuvqTQ+d4mTihxF4tmuanVpL+Bzv4anxKUNzFfPJqD3wNDNK4vpmFcnufb1T4WhmvI3rO8CB9eebpsXywtA9xMlM2YNRVpZZjv5ylvL+RnEAB7wabZ4eOF4SKsTFqggm38bjwJ6CDer/TJmIKIpeFYggmsUHwZbaWilD1nYvkcGuVCzkzo5SqePzXKFYIvwkJoggfPMHSxcsxtwO0ZoAAAAASUVORK5CYII=); }

#wcal_helpBox {
	text-align			: left;
	font-size			: 12px;
	background			: #ffffdd;
	margin				: 10px 20px;
	padding				: 5px 10px;
}
#wcal_helpBox strong {
	color				: Navy;
	font-size			: 14px;
}
.wcal_hide {
	display				: none;
}

/* =====  Bottom Footer (Contacts & Info)  ================================= */
#wcal_footer {
	padding     		: 3px;
	margin-top  		: 10px;
	background  		: buttonface;
	border-top  		: 1px inset;
}


/* =====  Content Area (Calendar, etc.)  ==================================== */
table tr td {
	margin				: 0px;
	padding				: 0px;
	border				: 1px black solid;
	width				: 20px;
	height				: 12px;
}
.wcal_tables {
	margin				: 0px;
	padding				: 0px;
	border				: 0px;
	border-collapse		: collapse;
	font				: inherit;
	margin-left			: auto; 
	margin-right		: auto;
	width				: 100%;
}

#wcal_schedContainer table tr td {
	margin				: 0px;
	padding				: 0px;
	border				: 1px black solid;
}

/* =====  Calendar Header  ===================================== */

.wcal_legendCell {
	border				: 0;
	padding-bottom		: 5px; 
	font-weight			: bolder;
	background			: white;
}
.wcal_headLeft, .wcal_headRight {
	display				: inline-block;
	width				: 20%;
}
.wcal_headCenter {
	display				: inline-block;
	width				: 59%;
}
.wcal_headLeft>div, .wcal_headRight>div, .wcal_headCenter>div {
	position			: relative;
	display				: inline-block;
	width				: 15px;
	height				: 12px;
	border				: 1px solid black;
	background-color	: transparent;
	margin-top			: 3px;
}

#wcal_container {
	display				: inline-block;
	position			: relative;
}

.wcal_month {
	text-align			: left;
	padding				: 0 2px;
	background			: white;
}
.wcal_year {
	background			: white;
}
.wcal_daysBar {
	background			: white;
}
.wcal_daysBar td {
	border-top			: 2px solid black;
	border-bottom		: 2px solid black;
}
.wcal_daysBar td:first-child {
	border-left			: 0;
}
.wcal_daysBar:first-child td:first-child {
	border-top			: 0;
}
.wcal_daysBar:last-child td:first-child {
	border-bottom		: 0;
	border-top			: 2px solid black;
}

.wcal_xo {
	position			: relative;
	overflow			: hidden;
	height				: 100%;
	width				: 100%;
}
.wcal_xo div {
	position			: absolute;
	height				: 100%;
	width				: 100%;
	overflow			: hidden;
	z-index				: 0;
}
.wcal_xo img {
	height				: 100%;
	width				: 100%;
}
.wcal_xo div.wcal_con {
	z-index				: 10;
}
.wcal_x {
	background-color	: white;
}
.wcal_o {
	background-color	: silver;
}
.wcal_blank {
	background-color	: black;
}

/* =====  Assigned Holidays  ================================================== */

#wcal_schedContainer {
	display				: inline-block;
	position			: relative;
	margin-top			: 0.25in;
}
#wcal_sched .wcal_xo div:nth-child(2) {
	padding				: 40% 0;
}
#wcal_sched {
	height				: 0.75in;
}
#wcal_sched tr td {
	width				: 0.5in;
	background			: transparent;
}
#wcal_sched tr:first-child td:first-child {
	width				: 0.6in;
	font-weight			: bolder;
}
#wcal_sched tr:last-child td:first-child, #wcal_sched tr:first-child td:nth-child(2) {
	width				: 0.4in;
	font-weight			: bolder;
}


/* =====  Holiday Table  ==================================================== */
#wcal_holidays  {
	margin-top			: 0.25in;
}
#wcal_holidays tr td {
	border				: 0;
	border-bottom		: 1px solid black;
	text-align			: left;
	padding-left		: 10px;
	padding-right		: 5px;
}
#wcal_yrLabels1, #wcal_yrLabels2 {
	border-top			: 0;
	border-bottom		: 2px solid black;
	font-weight			: bolder;
	font-size			: larger;
}
#wcal_holidays tr td:nth-child(3) {
	border				: 0;
}

</style>


		<div id="wcal_toolbar" class="wcal_header">

			<nav id="wcal_nav_wrap">
				<ul>
					<li><button onclick="id0.wcal.tb.print()" class="wcal_btns wcal_btnImgPrint" title="Click here to print the calendar without the artifacts created by using other buttons (best in Chrome).">Print</button></li>
					<li class="wcal_nav_separator">|</li>
					<li><input id="wcal_input" type="text" value="${+cfg.defaultYr}" onchange="id0.wcal.tb.gotoCal(this.value)" onclick="this.select()" title="Enter the desired year then click the button on the right to pull up that year's calendar." /><button onclick="id0.wcal.tb.gotoCal(document.getElementById('wcal_input').value)" class="wcal_btns wcal_btnImgGoToYr" title="Enter the desired year on the right then click this button to pull up that year's calendar.">Go To Year</button></li>
					<li><button onclick="id0.wcal.tb.previous()" class="wcal_btns wcal_btnImgPrevious" title="Go to previous year's calendars stepping two years at a time.">Previous</button></li>
					<li><button onclick="id0.wcal.tb.now()" class="wcal_btns wcal_btnImgCurrent" title="Get the current year's calendar.">Current</button></li>
					<li><button onclick="id0.wcal.tb.next()" class="wcal_btns wcal_btnImgNext" title="Go to future year's calendars stepping two years at a time.">Next</button></li>
					<li class="wcal_nav_separator">|</li>
					<li><button id="wcal_dd" class="wcal_btns wcal_btnImgShow wcal_dropdown">View <span id="wcal_dropdown_arrow"></span></button>
						<ul>
							<li><input type="checkbox" id="wcal_view1" name="wcal_view" class="wcal_view" checked="checked" value="wcal_table">		<label for="wcal_view1">Calendars</label></li>
							<li><input type="checkbox" id="wcal_view2" name="wcal_view" class="wcal_view" checked="checked" value="wcal_holidays">	<label for="wcal_view2">Holiday Lists</label></li>
							<li><input type="checkbox" id="wcal_view3" name="wcal_view" class="wcal_view" value="wcal_sched">						<label for="wcal_view3">Assigned Holidays</label></li>
						</ul></li>
					<li class="wcal_nav_separator">|</li>
					<li><button class="wcal_btns wcal_btnImgHelp" onclick="id0.wcal.tb.help('2yrCal')">Help</button></li>
				</ul>
			</nav>


			<div id="wcal_helpBox" class="wcal_hide">
				<p><strong>Print</strong> - Click to open the print dialogue.</p>
				<p><strong>Go To Year</strong> - Enter the desired year in the text box in front of the <strong>Go To Year</strong> button and then click on the <strong>Go To Year</strong> button to start the calendar on the desired year.</p>
				<p><strong>Previous</strong> - Click to start the calendar two years before the year currently shown on the calendar. Each click steps two more years into the past.</p>
				<p><strong>Current</strong> - Click to restore the displayed caledar to the current year.</p>
				<p><strong>Next</strong> - Click to start the calendar two years farther into the future than the year currently shown on the calendar. Each click steps two more years into the future.</p>
				<p><strong>View</strong> - Click to select which items to display with the calendar.</p>
				<p><strong>Help</strong> - Click to see or hide this help dialogue.</p>
				<hr />
				<p>This calendar was created by <a href="mailto:grumpily@gmail.com?subject=Work Calendar">Brent Starks</a> at <a href="mailto:grumpily@gmail.com?subject=Work Calendar">grumpily@gmail.com</a>. This is the person to contact regarding any issues or feature requests with this calendar. Please include the name and email address of the maintainer of the web page containing this calendar.</p>
				<p>Web page maintainers may find other more compatible versions of the calendar (and other resources) at <a href="http://id0.org/cucf/">http://id0.org/cucf/</a>.</p>
			</div>

		</div>

		<div id="wcal_page">
${getPageHtml(+cfg.defaultYr)}
		</div>

		<div id="wcal_footer">
			<p>
				For issues concerning this calendar, contact 
				<a href="mailto:grumpily@gmail.com?subject=Work Calendar" class="contact">Brent Starks</a> at 
				<a href="mailto:grumpily@gmail.com?subject=Work Calendar" class="contact">grumpily@gmail.com</a>.
			</p>
		</div>\n`;
		//Array.from(document.querySelectorAll('.wcal_img_x'), el => el.src = cfg.img_src_x );
		//Array.from(document.querySelectorAll('.wcal_img_o'), el => el.src = cfg.img_src_o );
		//document.getElementById('wcal_input').value = cfg.defaultYr;
		//renderPage(+cfg.defaultYr);
		// Toolbar settings below this point
		//Array.from(document.querySelectorAll('.wcal_view'), el => el.setAttribute("checked", "checked") );
		//Array.from(document.querySelectorAll('.wcal_view'), el => el.onchange = function () { id0.wcal.newView(this); } );
		document.getElementById('wcal_view1').onchange = function () { this.checked = "checked"; };
		//document.getElementById('wcal_view3').removeAttribute("checked");
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
		if (!document.getElementById('wcal_calendar')) 
			document.writeln('\n\n\n<div id="wcal_calendar">Loading calendar...</div>');
		main();
	};




})(window.id0 = window.id0 || {});


