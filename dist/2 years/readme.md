# Description of Versions
These are versions of an auto-updating two-year calendar, a holiday scheduling section (when initially created, holidays' days off were mandated for times other than legally defined dates), and a list of legally defined holidays as defined by Utah state code. These items were designed to display on a web page and to print on a single page of paper.

The calendars display a 28 day cycle of 12 hour X-squad and O-squad work days.

## Version 1.x.x
The code for version 1 was lost back around 2007 after the decision was made to use 3rd party libraries like jQuery to simplify development. It was created in 2000 using javascript for initial use on the Netscape browser.

## Version 2.x.x
jQuery was adopted for cross-browser compatability, DOM manipulation abilities, and reduced coding (maintainability). The initial adoption was in 2007 and then upgraded in 2009 and again in 2012.

## Version 3.x.x
This version was created to eliminate the need for including the jQuery library by substituting local function definitions for the five or so jQuery functions being used.

## Version 4.x.x
New native javascript functionality facilitated the streamlining of code. Some change in CSS, browser rendering, or hardware broke the print layout in early 2020. Use version 4.2.x or newer to avoid this print issue. All previous versions still work on a monitor.

## Version 5.x.x
Prompted by the need to revisit the code after the previously mentioned print issue and the new native ECMAScript functionality for web components, a rewrite was begun to compartmentallize the code into small, independant chunks with CSS isolation. 

There are both vanilla and lit-element versions. My aversion to libraries will likely end with a vanilla javascript version.

## Version 6.x.x
Nothing.



-----


[Pando Editor](https://pandao.github.io/editor.md/en.html): Open source online markdown editor.
