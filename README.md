# Chrome Extension - Down-Events Finder
This Chrome extension displays the usage of Down-Events (mousedown, pointerdown and touchstart) and whether they cause any changes to the attributes, childList and characterData of any element within the DOM.  
![ExampleShowcase2](https://github.com/user-attachments/assets/5264a47d-22ed-4639-b621-57c172462e00)

Options allow for further customization:
- Change the color of outlined elements.
- Enable a slower test for closely inspecting each element.
- Mark all elements with down-events.
- Test form elements (input and textarea).
- Enable or disable various filters for preventing / allowing the following observations:
  - "All Down-Events": any additional down-events after the first observed one.
  - "Styling": any attribute changes adding or removing css except "display".
  - "Falsy Values": any attribute changes adding or removing falsy values. 
  - "Identical Values": any down-event with no changes to the actual attributes or character data.  
  - "Aria-expanded": any down-event changing aria-expanded.
  - "Data": any attribute changes containing the string "data".
  - "Targeting Head and Title": any child list changes made to the head or title of the document.
 
## Installation
1. Clone the repository or download the ZIP file and extract it.
2. Open your Chrome extension settings (Settings / Three dots ->  Extensions -> Manage Extensions).
3. Click on "Load unpacked".
4. Navigate to the folder containing the extension (default name: pointer-cancellation-extension).
5. Click on "Select Folder".
6. Navigate to the details page of the extension
7. Turn the extension on and change any additional settings.
8. The extension can now be used on any page by opening the Chrome devtools and selecting the panel.

## Development
1. Clone the repository.
2. Open your IDE and open the newly cloned repository (default name: pointer-cancellation-extension).
3. You can now start making changes.

Websites for testing the extension can be found on [GitHub](https://github.com/Prevail29/pointer_website_examples) as well.

## License
This extension is licensed under the MIT license.
View the LICENSE.txt file for more information.




