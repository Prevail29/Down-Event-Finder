function displayResults(colors, downEvents, checkboxes) {
    const [primaryWarningColor, secondaryWarningColor, primaryProblemColor, secondaryProblemColor] = colors
    const [checkboxProblem, checkboxWarning, checkboxUnobservable,
        checkboxMousedown, checkboxPointerdown, checkboxTouchstart] = checkboxes
    if (!document.getElementById("sytleElementDownEventFinder")) {
        let style = document.createElement('style')
        style.setAttribute("id", "sytleElementDownEventFinder")
        style.innerHTML = `.warningAttributeDownEventFinder {
            border: 4px dashed ${primaryWarningColor} !important; 
            outline: 4px dashed ${secondaryWarningColor} !important;
        } 
        .problemAttributeDownEventFinder {
            border: 5px solid ${primaryProblemColor} !important; 
            outline: 5px solid ${secondaryProblemColor} !important;
        }`
        document.head.appendChild(style)
    }

    for (const [key, value] of Object.entries(downEvents)) {
        const element = document.querySelector(`[data-downEventsFinder-id=${key}]`)
        if (element) {
            // Simple Case: Element only has a single down-event
            if (value.length === 1) {
                const eventListener = value[0].eventListener
                const state = value[0].state
                let displayState, displayDownEvent = undefined
                switch (state) {
                    case "problem":
                        displayState = checkboxProblem
                        break;
                    case "warning":
                        displayState = checkboxWarning
                        break;
                    case "unobservable":
                        displayState = checkboxUnobservable
                        break;
                }
                switch (eventListener) {
                    case "touchstart":
                        displayDownEvent = checkboxTouchstart
                        break;
                    case "pointerdown":
                        displayDownEvent = checkboxPointerdown
                        break;
                    case "mousedown":
                        displayDownEvent = checkboxMousedown
                        break;
                }
                if (displayDownEvent && displayState) {
                    if (state === "problem") {
                        changeClass(element, "problem")
                        element.nextElementSibling.style.display = "inline"
                    } else changeClass(element, "warning")
                } else {
                    changeClass(element, null)
                    if (state === "problem") element.nextElementSibling.style.display = "none"
                }
            } else {
                // Complex Case: Multiple down-events exist
                let problemElements = []
                let warningElements = []
                let unobservableElements = []
                let displayProblem, displayWarning, displayUnobservable = false
                // Get all States with the corresponding Down-Event 
                value.forEach((element) => {
                    switch (element.state) {
                        case "problem":
                            problemElements.push(element.eventListener)
                            break;
                        case "warning":
                            warningElements.push(element.eventListener)
                            break;
                        case "unobservable":
                            unobservableElements.push(element.eventListener)
                            break;
                    }
                })
                // Inspect whether state shall be displayed
                if (problemElements.length > 0 && checkboxProblem) {
                    for (const eventListener of problemElements) {
                        if (eventListener === "touchstart" && checkboxTouchstart) {
                            displayProblem = true
                            break;
                        } else if (eventListener === "pointerdown" && checkboxPointerdown) {
                            displayProblem = true
                            break;
                        } else if (eventListener === "mousedown" && checkboxMousedown) {
                            displayProblem = true
                            break;
                        } else displayProblem = false
                    }
                }
                if (warningElements.length > 0 && checkboxWarning) {
                    for (const eventListener of warningElements) {
                        if (eventListener === "touchstart" && checkboxTouchstart) {
                            displayWarning = true
                            break;
                        } else if (eventListener === "pointerdown" && checkboxPointerdown) {
                            displayWarning = true
                            break;
                        } else if (eventListener === "mousedown" && checkboxMousedown) {
                            displayWarning = true
                            break;
                        } else displayWarning = false
                    }
                }
                if (unobservableElements.length > 0 && checkboxUnobservable) {
                    for (const eventListener of unobservableElements) {
                        if (eventListener === "touchstart" && checkboxTouchstart) {
                            displayUnobservable = true
                            break;
                        } else if (eventListener === "pointerdown" && checkboxPointerdown) {
                            displayUnobservable = true
                            break;
                        } else if (eventListener === "mousedown" && checkboxMousedown) {
                            displayUnobservable = true
                            break;
                        } else displayUnobservable = false
                    }
                }
                // Display infoBoxes depending on whether the Down-Event and States are checked or unchecked
                if (problemElements.length > 0) {
                    problemElements.forEach((eventListener) => {
                        let problemInfoBox = element.nextElementSibling
                        let hideInfoBox = false
                        switch (eventListener) {
                            case "touchstart":
                                if (!checkboxTouchstart) hideInfoBox = true
                                break;
                            case "pointerdown":
                                if (problemElements.includes("touchstart")) problemInfoBox = element.nextElementSibling.nextElementSibling
                                if (!checkboxPointerdown) hideInfoBox = true
                                break;
                            case "mousedown":
                                if (problemElements.length === 3) problemInfoBox = element.nextElementSibling.nextElementSibling.nextElementSibling
                                else if (problemElements.length === 2) problemInfoBox = element.nextElementSibling.nextElementSibling
                                if (!checkboxMousedown) hideInfoBox = true
                                break;
                        }
                        if (hideInfoBox || !checkboxProblem) problemInfoBox.style.display = "none"
                        else problemInfoBox.style.display = "inline"
                    })
                }
                // Change style attribute
                if (displayProblem) changeClass(element, "problem") 
                else if (displayWarning || displayUnobservable) changeClass(element, "warning") 
                else changeClass(element, null)
            }
        }
    }
}

function changeClass(element, state) {
    switch (state) {
        case "problem":
            element.classList.add("problemAttributeDownEventFinder")
            element.classList.remove("warningAttributeDownEventFinder")
            break;
        case "warning":
            element.classList.add("warningAttributeDownEventFinder")
            element.classList.remove("problemAttributeDownEventFinder")
            break;
        case null:
            element.classList.remove("problemAttributeDownEventFinder", "warningAttributeDownEventFinder")
            break;
    }
}