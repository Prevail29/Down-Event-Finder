# Chrome Extension - Down-Events Finder
This Chrome extension displays the usage of down-events (mousedown, pointerdown, and touchstart) and whether they cause any changes to the attributes, childList, and characterData of any element within the DOM, assisting the test of the WCAG Success Criterion 2.5.2 - Pointer Cancellation.

![Showcase](https://github.com/user-attachments/assets/7fdac1c8-8e50-4ecc-b3d1-fdfcde2c44ae)

Options allow for further customization:
- Enable a slower test for closely inspecting each element.
- Enable or disable various filters for preventing / allowing the following observations:
  - "All Down-Events": any additional down-events after the first observed one.
  - "Styling": any attribute changes adding or removing CSS except for the property "display".
  - "Falsy Values": any attribute changes adding or removing falsy values. 
  - "Identical Values": any down-event with no changes to the actual attributes or character data.  
  - "Aria-expanded": any down-event changing aria-expanded.
  - "Data": any attribute changes containing the string "data".
  - "Targeting Head and Title": any child list changes made to the head or title of the document.
- Change the problem, warning, and highlighting colors.

Additionally, after running the test, the results can be further customized:
- Display certain states (e.g. only display elements with the "problem" state).
- Display certain down-events (e.g. only display touchstart down-events).
- Display input and textarea element changes.

More features include:
- Clicking on any result and viewing the element in the "elements" panel.
- Personalizing your settings by being able to save options.
- Iteratively highlighting all elements with down-events. 

## Installation
1. Clone the repository or download the ZIP file and extract it.
2. Open your Chrome extension settings (Settings / Three dots -> Extensions -> Manage Extensions).
3. Click on "Load unpacked".
4. Navigate to the folder containing the extension (default name: Down-Event-Finder).
5. Click on "Select Folder".
6. Navigate to the details page of the extension
7. Turn on the extension and change any additional settings.
8. The extension can now be used on any page by opening the Chrome devtools and selecting the "Down-Events Finder" panel.

## Development
1. Clone the repository.
2. Open your IDE and open the newly cloned repository (default name: Down-Event-Finder).
3. Changes can now be made.

Websites for testing the extension can be found on [GitHub](https://github.com/Prevail29/pointer_website_examples).

## License
This extension is licensed under the MIT license.
View the LICENSE.txt file for more information.





