# Chrome Extension - Down-Events Finder
<img width="1400" height="560" alt="Marquee_Image" src="https://github.com/user-attachments/assets/c19a352f-0d40-4678-86ec-9f9073bd27f4" />

A Chrome extension assisting users evaluating the Web Content Accessibility Guideline Success Criterion 2.5.2 Pointer Cancellation by identifying and listing all elements on any website containing at least one of the three down-events: mousedown, pointerdown, and touchstart.

Main features include: 
- Listing and highlighting all elements using down-events.
- Evaluating the severity of the down-event and giving it one of the three states: "unobservable", "warning/minor change," or "problem/major change".
- Quick and easy installation allowing for immediate testing.

Options allow for further customization:
- Enable a slower test for closely inspecting each element.
- Enable automatic reloading for immediate testing after the page has been reloaded or a new website has been opened.
- Enable or disable various filters for preventing / allowing the following observations:
  - "All Down-Events": any additional down-events after the first observed one.
  - "Styling": any attribute changes adding or removing CSS except for the property "display".
  - "Falsy Values": any attribute changes adding or removing falsy values. 
  - "Identical Values": any down-event with no changes to the actual attributes or character data.  
  - "Aria-expanded": any down-event changing aria-expanded.
  - "Data": any attribute changes containing the string "data".
  - "Targeting Head and Title": any child list changes made to the head or title of the document.
- Change the problem, warning, and highlighting colors.

After running the test, more options and features are available:
- Display specific states (e.g., only display elements with the "problem" state).
- Display specific down-events (e.g., only display touchstart down-events).
- Display input and textarea element changes.
- Click on any result and view the element in the "elements" panel.
- Iteratively highlight all elements with down-events.

![Showcase](https://github.com/user-attachments/assets/c1020ac8-71f9-47ed-95fc-c5c67f81793a)

## Usage
1. Open the website that you would like to test.
2. Open the Chrome DevTools:
   * Either by pressing the F12 key.
   * Or by right-clicking on the website and selecting "inspect".
4. Within the Chrome DevTools: Click on the ">>" Symbol in the upper bar and select the "Down-Event Finder" tab.
5. The currently viewed website can now be testeed by clicking on the "Start Test" button in the "Down-Event Finder" panel.

## Installation
1. Clone the repository or download the ZIP file and extract it.
2. Open your Chrome extension settings (Settings / Three dots -> Extensions -> Manage Extensions).
3. Enable "Developer mode" by clicking on the switch in the top-right corner. 
4. Click on "Load unpacked".
5. Navigate to the folder containing the extension (default name: Down-Event-Finder).
6. Click on "Select Folder".
7. Navigate to the details page of the extension
8. Turn on the extension and change any additional settings.
9. The extension can now be used on any page by opening the Chrome devtools and selecting the "Down-Event Finder" panel.

## Development
1. Clone the repository.
2. Open your IDE and open the newly cloned repository (default name: Down-Event-Finder).
3. Changes can now be made.

Websites for testing the extension can be found on [GitHub](https://github.com/Prevail29/pointer_website_examples).

## License
This extension is licensed under the MIT license.
View the LICENSE.txt file for more information.
