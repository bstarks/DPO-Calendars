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


	TODO:
		* speed color change rendering
		* clean code
		* get svg button images
		* on configuration page for setting:
			* set month separator borders' color
			* set colors background/text for months
			* set payday/holiday options (which to show; background/border-color; etc.)
*/

(function (id0, $) {
	// id0 is created as my global namespace. wcal is the work calendar namespace.
	if (!id0.wcal) id0.wcal = {};
	// pocket is the namespace for this app. [The next 2 lines should replace the line after for namespacing this app in the presence of the calendar.]
	// if (!id0.wcal.pocket) id0.wcal.pocket = {};
	// var c = id0.wcal.pocket, // create shorthand reference to the (c)alendar object for use within this function
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
				[ 1,  1, "Day",      "New Year's Day"  ],  // January on 1st Day
				[ 1,  3, "Monday",   "Dr. MLK, Jr. Day"],  // January on 3rd Monday
				[ 2,  3, "Monday",   "President's Day" ],  // February on 3rd Monday
				[ 5,  5, "Monday",   "Memorial Day"    ],  // May on last Monday
				[ 7,  4, "Day",      "Independence Day"],  // July on 4th Day
				[ 7, 24, "Day",      "Pioneer Day"     ],  // July on 24th Day
				[ 9,  1, "Monday",   "Labor Day"       ],  // September on 1st Monday
				[10,  2, "Monday",   "Columbus Day"    ],  // October on 2nd Monday
				[11, 11, "Day",      "Veteran's Day"   ],  // November on 11th Day
				[11,  4, "Thursday", "Thanksgiving Day"],  // November on 4th Thursday
				[12, 25, "Day",      "Christmas Day"   ]   // December on 25th Day
			],
			colors: {
				xDay: 'cyan',
				oDay: 'bisque',
				pDayBorder: 'green',
				hDayBorder: 'yellow',
				monthBorder: 'blue'
			},
			isDoubleModified: false,
			isHolidayPreferred: true,
			isPaydayBorder: true
		},
		toolbar = {},
		isFirstRender = true,
		optionsMenu = {
			_default: {
				'wcal_optXDaysBgColor'			: '#a3ffa3',
				'wcal_optXDaysFgColor'			: '#000000',
				'wcal_optODaysBgColor'			: '#ffe2a9',
				'wcal_optODaysFgColor'			: '#000000',
				'wcal_optMonthPartitionColor'	: '#000000',
				'wcal_optHeaderFgColor'			: '#000000',
				'wcal_optHeaderBorderColor'		: '#000000',
				'wcal_optMonthPartitionLineSize': 2,
				'wcal_optHeaderShowBorders'		: false
			},
			defaultPalette: ['#000000', '#a3ffa3', '#ffe2a9'],
			selected: '',
			currentSettings: {},
			init: function () {
				optionsMenu.currentSettings = JSON.parse(JSON.stringify(optionsMenu._default));
			}
		};
	optionsMenu.init();
	cfg.baseDate = new Date(cfg.baseYr, 0, 1);
	cfg.defaultYr = (new Date()).getFullYear();
	cfg.yrShowing = cfg.defaultYr;
	cfg.lastValidYr = cfg.defaultYr;
	// xoPattern is an array of squads/days that always starts with the squad/day 
	// associated with the first Friday (beginning the X-Squad 4 day work period) 
	// of the 28 day cycle.
	cfg.xoPattern = (function () {
		var a = [];
		for (var i = 0; i < 29; i++) a = a.concat(cfg.xoDayPattern);
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
		};
	}
	if (typeof((new Date()).daysInMonth) === "undefined") {
		Date.prototype.daysInMonth = function (i) {
			return [31, (this.isLeapYear() ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][i];
		};
	}
	if (typeof((new String()).tmpl) === "undefined") {
		String.prototype.tmpl = function (json) {
			return this.replace(/\${([^{}]+)}/g, function(textMatched, key) { return json[key]; });
		};
	}

	// Convenience function to slightly mimic jQuery behaviors while keeping my 
	// utilities packaged away from app specific code.
	var f = function (elementId) {
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
		this.isArray = function (obj) { return Object.prototype.toString.call( obj ) === '[object Array]'; };
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
			var t = typeof templateId === 'string' ? f(templateId).html() : (typeof this.id() === 'string' ? f('#' + this.id() + '_tmpl').html() : false);
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

	var $css = function (fileName) {
		// https://bugs.chromium.org/p/chromium/issues/detail?id=45786
		// https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet
		// https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model
		// http://www.ianbicking.org/blog/2015/12/product-journal-css-object-model.html
		// http://www.javascriptkit.com/dhtmltutors/externalcss3.shtml
		// https://www.w3.org/wiki/Dynamic_style_-_manipulating_CSS_with_JavaScript
		// http://stackoverflow.com/questions/33784443/how-modify-a-property-of-external-css-file-using-jquery-javascript
		// http://www.mediaevent.de/javascript/DOM-Stylesheets.html
		var getStyleSheet = function (name) {
			var nameType = /\.css$/i.test(name) ? 'href' : 'title';
			for (var stylesheet = 0, len = document.styleSheets.length; stylesheet < len; stylesheet++) {
				if (document.styleSheets[stylesheet][nameType] && document.styleSheets[stylesheet][nameType].toString().indexOf(fileName) != -1)
					return document.styleSheets[stylesheet];
			}
			// If above fails, see if the href contains the name without the .css extension.
			for (stylesheet = 0, len = document.styleSheets.length; stylesheet < len; stylesheet++) {
				if (document.styleSheets[stylesheet].href && document.styleSheets[stylesheet].href.toString().indexOf(fileName) != -1)
					return document.styleSheets[stylesheet];
			}
			return null;
		},
			ss = getStyleSheet(fileName);		
		
		this.rule = function(queryRule) {
			for (var i = 0, l = ss.cssRules.length; i < l; i++) {
				if (ss.cssRules[i].selectorText && ss.cssRules[i].selectorText.toString().indexOf(queryRule) != -1)
					return ss.cssRules[i];
			}
			return null;
		};
		
		return this;
	};


	function getHolidayMap(yr) {
		var holidays = cfg.utHolidays,
			holidayMap = {},
			month = 0,
			getDate = function (holiday, year) {
				var adjDate = { "Sunday": [6, 0, 1, 2, 3, 4, 5], "Monday": [5, 6, 0, 1, 2, 3, 4], "Tuesday": [4, 5, 6, 0, 1, 2, 3], "Wednesday": [3, 4, 5, 6, 0, 1, 2], "Thursday": [2, 3, 4, 5, 6, 0, 1], "Friday": [1, 2, 3, 4, 5, 6, 0], "Saturday": [0, 1, 2, 3, 4, 5, 6] },
					adjHoliday = null,
					holidayDate = 0,
					day = holiday[2],
					date = holiday[1],
					month = holiday[0] - 1,
					objDate = new Date(yr, month, 1),
					weekday = objDate.getDay();
				// For holidays that are specified for specific dates (e.g. Christmas: Dec. 25), return date.
				if (day === "Day") { return date; }
				// Calculate dates for holidays that are on a specified day of the week (e.g. Thursday for Thanksgiving)
				// Here, 'date' is actually the count of weekdays (e.g. 3 for the third Monday which President's Day falls 
				// on) and will never be greater than 5 which means the last occurance of that weekday in the month.
				holidayDate = (7 * date) - adjDate[day][weekday];
				return ((holidayDate > objDate.daysInMonth(month)) ? holidayDate - 7 : holidayDate);
			};

		for (var i = 0, len = holidays.length; i < len; i++) {
			month = holidays[i][0] - 1;
			if (!holidayMap[month]) holidayMap[month] = {};
			holidayMap[month][getDate(holidays[i], yr)] = 'H';
		}
		return holidayMap;
	}
	
	function getDaysDataForYear(yr) {
		var i = 0,
			days = [],
			day = 2,
			l = 0,
			date = new Date(yr, 0, 1),
			weekday = date.getDay(),
			holidays = getHolidayMap(yr),
			numberOfDaysToFillAllWeeks = 379, // = 7 (days per week) * 54 (weeks needing to be filled) + 1 //Math.floor((weekday + 365 + (date.isLeapYear ? 1 : 0)) % 7) + (weekday + 365 + (date.isLeapYear ? 1 : 0)),
			millisecondsPerDay = 86400000,			
			// offset determines how many cells/days must be removed (the offset) to make 
			// the xoPattern array align properly with the first day of the year.
			offset = Math.floor(Math.floor((date.getTime() - (cfg.baseDate).getTime()) / millisecondsPerDay)  % cfg.xoDayPattern.length),
			xoPattern = cfg.xoPattern.slice(28 + offset - weekday, 28 + offset - weekday + numberOfDaysToFillAllWeeks ); //cfg.xoPattern.length);

		for (var month = 0; month < 12; month++) {
			for (day = 1, l = date.daysInMonth(month) + 1; day < l; day++) {
				// If the year does not start on Sunday, insert days at the beginning so it will.
				if (day === 1 && month === 0 && weekday > 0) {
					for (var d = weekday; d > 0; d--) {
						days[i] = [xoPattern[i][0], 31 - d, /\$/g.test(xoPattern[i][1]) ? '$' : '', '', xoPattern[i][1].replace(/\$/g, '')];
						i++;
					}
				}
				days[i] = [xoPattern[i][0], day, /\$/g.test(xoPattern[i][1]) ? '$' : '', (typeof holidays[month] === 'object' && holidays[month][day]) ? 'H' : '', xoPattern[i][1].replace(/\$/g, '')];
				i++;
			}
		}
		// If the year does not end on a Saturday, insert days at the end so it will.
		if (i !== xoPattern.length) {
			for (day = 1, l = xoPattern.length - i; day < l; day++) {
				days[i] = [xoPattern[i][0], day, /\$/g.test(xoPattern[i][1]) ? '$' : '', '', xoPattern[i][1].replace(/\$/g, '')];
				i++;
			}
		}
		return days;
	}

	function buildCalendarCardHtmlForYear(yr) {
		var XO = 0,
			DATE = 1,
			$DAY = 2,
			H = 3,
			DAY = 4,
			CELL = 5,
			d = 0,
			day = '',
			weeks =[],
			month = 0,
			color = {'x': 'wcal_bgColor_x', 'o': 'wcal_bgColor_o'},
			xo = 'x',
			date = new Date(yr, 0, 1),
			borderStyle = '',
			calendar = [],
			daysHtml = [],
			monthsHtml = [],
			i = 0,
			isMonthEnd = false,
			span = 0,
			pattern = getDaysDataForYear(yr),
			patternLength = pattern.length,
			pdBorder = '',
			lastDayOfMonth = 0,
			paddingWeek = '\n<tr class="wcal_padwk">\n\t<td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>\n</tr>\n',
			weekCount = 0;

		// Go through each day and add cell data for that day.
		for (i = 0; i < patternLength; i++) {
			day = pattern[i][DATE];
			borderStyle = '';
			if (day < 8) {
				borderStyle = ' wcal_topLine';
				if (day === 1) {
					if (!(/S/gi.test(pattern[i][DAY]) && /M/gi.test(pattern[i + 1][DAY]))) borderStyle += ' wcal_leftLine';
				}
			}
			day = '' + day + (cfg.isDoubleModified ? pattern[i][H] + pattern[i][$DAY] : (cfg.isHolidayPreferred ? pattern[i][H] : pattern[i][$DAY]));
			xo = pattern[i][XO];
			pdBorder = cfg.isPaydayBorder && pattern[i][$DAY] ? ' wcal_payBorder' : '';
			pattern[i][CELL] = '<td class="wcal_${xo}${border}"><div class="wcal_xo"><div><canvas class="${color}" width="1" height="1"></canvas></div><div class="wcal_con_${xo}${$border}">${day}</div></div></td>'
				.tmpl({'day': day, 'color': color[xo], 'xo': xo, 'border': borderStyle || '', '$border': pdBorder});
		}

		i = 0;
		for (month = 0; month < 12; month++) {
			lastDayOfMonth = date.daysInMonth(month);
			// For each week...
			for (var w = 0; w < 6; w++) {
				// add a new row to the calendar
				daysHtml[0] = span === 0 ? '\n<tr>\n\t<td rowspan=${span} class="wcal_monthLabel wcal_topLine">${month}</td>' : '\n<tr>';
				// by adding 7 days to the days collection
				for ( d = 1; d < 8; d++) {
					// If bold separator border doesn't belong, remove it before adding day (or month label)
					if ((month === 0 && w === 0)||(month === 6 && w === 0)) {
						daysHtml[0] = daysHtml[0].replace(/ wcal_topLine/g, '');
						daysHtml[d] = '\n\t' + pattern[i][CELL].replace(/ wcal_topLine/g, '');
					// else add day as configured
					} else
						daysHtml[d] = '\n\t' + pattern[i][CELL];
					// but notice if we reach the end of the month (excluding Dec. of the previous year) so we can stop adding weeks
					if (i > 25 && pattern[i][DATE] === lastDayOfMonth) isMonthEnd = true;
					i++;
				}
				// add the collection of days to the weeks collection
				weeks[w] = daysHtml.join('') + '\n</tr>\n';
				// count the weeks in a month
				span++;
				daysHtml = [];
				// If we reached the end of the month, stop adding weeks.
				if (isMonthEnd) {
					if (month === 5 && (weekCount + weeks.length) < 27) {
						weekCount += 1;
						weeks[w] += paddingWeek;
					}
					if (month === 11 && (weekCount + weeks.length) < 54) continue;
					isMonthEnd = false;
					break;
				}
			}
			weekCount += weeks.length;
			// Add the weeks collection to a month in the months collection (inject rowspan and month label)
			monthsHtml[month] = weeks.join('').tmpl({'span': span, 'month': date.Month(month).substr(0, 3)});
			// clean up
			isMonthEnd = false;
			weeks = [];
			span = 0;
		}
		calendar[0] = monthsHtml.slice(0, 6).join('');
		calendar[1] = monthsHtml.slice(6, 12).join('');
		return calendar;
	};
	

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
		var data = {},
			calendar = [];
		yr = isValidYr(+yr);
		if (yr === false) return;
		calendar =  buildCalendarCardHtmlForYear(+yr);
		
		data = {
			yr: yr,
			front: calendar[0],
			back: calendar[1],
			xImg: cfg.img_src_x,
			oImg: cfg.img_src_o
		};
		if (isFirstRender) {
			// Render the toolbar and footer for only the first call.
			isFirstRender = false;
			f('#wcal_calendar').template({'yr': yr});
		}
		// Render the calendar, assigned holidays, and holiday lists on all calls.
		f('#wcal_printArea').template(data);
		for (var i = 0; i < 5; i++) $('#wcal_cardSets_' + i).html($('#wcal_cardSets_main').html());
		setCanvasColors();
	}
	
	function setCanvasColors(xo) {
		function setColor(el) {
			var c = el.getContext("2d");
			c.fillStyle = optionsMenu.currentSettings[(xo === 'x' ? 'wcal_optXDaysBgColor' :  'wcal_optODaysBgColor')];
			c.fillRect(0,0,1,1);
		}

		if (xo && xo.length === 1) f('canvas.wcal_bgColor_' + xo).forEach(setColor);
		else {
			xo = 'x';
			f('canvas.wcal_bgColor_x').forEach(setColor);
			xo = 'o';
			f('canvas.wcal_bgColor_o').forEach(setColor);
		}
	}

	function setColor(hexColor) {
		var id = optionsMenu.selected,
			currentColor = optionsMenu.currentSettings[id],
			squad = 'x',
			ss = 'wcal_pocketStylesheet';

		// If not a color value, another non-color option was selected
		// and we need to return without further processing.
		if ( !currentColor || typeof currentColor !=='string' || currentColor.length === 0 || currentColor.substr(0,1) !== '#' ) return;
		optionsMenu.currentSettings[id] = hexColor;

		if (id) { squad = id.substr(8,1).toLowerCase(); }

		switch (id) {
			// change x/o background color
			case 'wcal_optXDaysBgColor': 
			case 'wcal_optODaysBgColor': {
				$css(ss).rule(".wcal_" + squad).style.backgroundColor = hexColor;
				setCanvasColors(squad);
				break;
			}
			// change x/o foreground color
			case 'wcal_optXDaysFgColor': 
			case 'wcal_optODaysFgColor': {
				$css(ss).rule(".wcal_con_" + squad).style.color = hexColor;
				$css(ss).rule(".wcal_" + squad).style.color = hexColor;
				break;
			}
			case 'wcal_optMonthPartitionColor': { //
				$('#wcal_optMonthPartitionColor .wcal_colorSwatch').css('borderTopColor', hexColor);
				$css(ss).rule('.wcal_topLine').style.borderTopColor = hexColor;
				$css(ss).rule('.wcal_leftLine').style.borderLeftColor = hexColor;
				break;
			}
			case 'wcal_optHeaderFgColor': {
				$css(ss).rule('.wcal_hd').style.color = hexColor;
				$css(ss).rule('.wcal_optHd').style.color = hexColor;
				break;
			}
			case 'wcal_optHeaderBorderColor': {
				$css(ss).rule('#wcal_printArea th').style.borderColor = hexColor;
				$css(ss).rule('#wcal_optHeaderBorderColor .wcal_colorSwatch').style.borderTopColor = hexColor;
				break;
			}
		}
	}

	function revertColor() {

	}

	function updatedateUISelection(el, isColor) {
		$('.wcal_optionsList li').removeClass('wcal_optSelectedLi');
		$(el).addClass('wcal_optSelectedLi');
		if (isColor) optionsMenu.selected = el.id;
	}
	toolbar = {
		cmd: { // API for accessing features contained within pocket calendar app
			"print": function () {
				f('#wcal_printArea').el.style.border = 'none';
				window.print();
			},
			"gotoCal": function (yr) { renderPage(yr); },
			"previous": function () { renderPage(cfg.yrShowing - 1); },
			"now": function () { renderPage(cfg.defaultYr); },
			"next": function () { renderPage(cfg.yrShowing + 1); },
			"options": function () {
				f('#wcal_optionsBox').classList.toggle();
				if (!(f('#wcal_helpBox').el.style.display === 'undefined' || f('#wcal_helpBox').el.style.display === '' || f('#wcal_helpBox').el.style.display === 'none')) f('#wcal_helpBox').classList.toggle();
			},
			"help": function (whichCal) {
				f('#wcal_helpBox').classList.toggle();
				if (!(f('#wcal_optionsBox').el.style.display === 'undefined' || f('#wcal_optionsBox').el.style.display === '' || f('#wcal_optionsBox').el.style.display === 'none')) f('#wcal_optionsBox').classList.toggle();
			},
			
			// Options menu commands
			"updateColor": function (color) { setColor(color); },
			"getNewColor": function (el) { updatedateUISelection(el, true) },
			"getLineSize": function (el) {
				updatedateUISelection(el);
				$('#wcal_optLineSizeTxt').html( el.value );
				$css('wcal_pocketStylesheet').rule('.wcal_topLine').style.borderWidth = el.value + 'px !important';
				//$css('wcal_pocketStylesheet').rule('.wcal_leftLine').style.borderWidth = el.value + 'px !important';
			},
			"showBorder": function (el) {
				var span = $('#wcal_optHeaderShowBorders span'),
					newSpanValue = span.html() === 'Show' ? 'Hide' : 'Show';
				updatedateUISelection(el);
				span.html(newSpanValue);
				$css('wcal_pocketStylesheet').rule('.wcal_hd').style.borderStyle = (newSpanValue === 'Hide' ? 'solid' : '');
			}
	},
		behaviors: {
			'init': function () {
				$('#wcal_optLineSizeTxt').html( $('#wcal_optLineSize').attr('value') );
			}
		}
	};
	// These are the functions called from the toolbar
	c.tb = toolbar.cmd;
	c.newView = toolbar.cmd.newView;

	function init() {
		renderPage(+cfg.defaultYr);
		$('#wcal_spectrum').spectrum({
			color: 'cyan',
			flat: true,
			showInput: true,
			showInitial: true,
			allowEmpty: false,
			showAlpha: true,
			disabled: false,
			localStorageKey: '',
			showPalette: true,
			showPaletteOnly: false,
			togglePaletteOnly: false,
			showSelectionPalette: true,
			clickoutFiresChange: true,
			showButtons: false,
			cancelText: 'Cancel',
			chooseText: 'Select',
			togglePaletteMoreText: 'More',
			togglePaletteLessText: 'Less',
			containerClassName: 'wcal_spectrum-container',
			replacerClassName: 'wcal_spectrum-replacer',
			preferredFormat: 'hex',
			maxSelectionSize: 20,
			palette: [
				["#000","#444","#666","#999","#ccc","#eee","#f3f3f3","#fff"],
				["#f00","#f90","#ff0","#0f0","#0ff","#00f","#90f","#f0f"],
				["#f4cccc","#fce5cd","#fff2cc","#d9ead3","#d0e0e3","#cfe2f3","#d9d2e9","#ead1dc"],
				["#ea9999","#f9cb9c","#ffe599","#b6d7a8","#a2c4c9","#9fc5e8","#b4a7d6","#d5a6bd"],
				["#e06666","#f6b26b","#ffd966","#93c47d","#76a5af","#6fa8dc","#8e7cc3","#c27ba0"],
				["#c00","#e69138","#f1c232","#6aa84f","#45818e","#3d85c6","#674ea7","#a64d79"],
				["#900","#b45f06","#bf9000","#38761d","#134f5c","#0b5394","#351c75","#741b47"],
				["#600","#783f04","#7f6000","#274e13","#0c343d","#073763","#20124d","#4c1130"]
			],
			selectionPalette: optionsMenu._default.palette,
			move: function(color) {
				if (color) {
					setColor(color.toString());
				}
			}
		});
		toolbar.behaviors.init();
		//document.getElementById('showHtml').innerHTML = document.getElementById('wcal_calendar').innerHTML;
	}


	window.onload = function () {
		init();
	};

})(window.id0 = window.id0 || {}, $);

