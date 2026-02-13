async function testWebsite(filter, slowValues, colors, downEvents) {
    // Create states
    const State = Object.freeze({
        UNOBSERVABLE: "unobservable",
        WARNING: "warning",
        PROBLEM: "problem"
    })

    // Create results
    let results = {
        formsChanged: false,
        changedFormElements: [],
        unobservableDownEvents: [],
        warningDownEvents: [],
        problemDownEvents: []
    }

    let aborted = false

    // Create important Events
    const mousedown = new MouseEvent("mousedown", {
        view: window,
        bubbles: true,
        cancelable: true
    })

    const touchstart = new TouchEvent("touchstart", {
        view: window,
        bubbles: true,
        cancelable: true
    })

    const pointerdown = new PointerEvent("pointerdown", {
        view: window,
        bubbles: true,
        cancelable: true,
    })

    // Create variables for the MutationObserver
    const target = document
    const config = {
        attributes: true,
        attributeOldValue: true,
        childList: true,
        characterData: true,
        characterDataOldValue: true,
        subtree: true
    }
    const observer = new MutationObserver(callback)

    // Get important elements of the current website 
    const formElements = document.body.querySelectorAll("textarea, input")
    const htmlDialog = document.querySelectorAll("dialog")

    // Get values from panel
    const [primaryWarningColor, secondaryWarningColor, primaryProblemColor, secondaryProblemColor, highlightBackgroundColor, highlightBorderColor] = colors
    const [slowCheckbox, speed] = slowValues
    if (downEvents.length === 0) return results

    // Callback function for the MutationObserver
    function callback(mutations, eventType, eventListeners) {
        let message = undefined
        if (mutations.length === 0) return [State.UNOBSERVABLE, message]
        if (filter["multipleDownEvents"]) {
            let indexEvent = eventListeners.indexOf(eventType)
            if (eventListeners.length > 1 && indexEvent != 0) return [State.WARNING, message]
        }
        switch (mutations[0].type) {
            // Filter attributes
            case "attributes":
                let oldAttributes = mutations[0].oldValue
                let newAttributes = mutations[0].target.getAttribute(mutations[0].attributeName)
                let mutationTarget = mutations[0].target
                let mutationAttributeName = mutations[0].attributeName

                if (filter["cssFilter"] && (mutationAttributeName === "class") && (getComputedStyle(mutationTarget).display != "none")) {
                    return [State.WARNING, message]
                }
                if (filter["ariaExpandedFilter"] && (mutationAttributeName === "aria-expanded")) {
                    return [State.WARNING, message]
                }
                if ((filter["cssFilter"]) && (mutationAttributeName === "style")) {
                    if (((oldAttributes) && !oldAttributes.includes("display")) || ((newAttributes) && !newAttributes.includes("display"))) {
                        return [State.WARNING, message]
                    }
                }
                if (filter["dataFilter"] && (mutationAttributeName.toUpperCase().includes("DATA"))) {
                    return [State.WARNING, message]
                }
                if (filter["falsyFilter"] && (!oldAttributes && !newAttributes) && (mutationTarget.tagName != "DIALOG") && (mutationTarget.tagName != "INPUT")) {
                    return [State.WARNING, message]
                }
                if (filter["sameAttributeFilter"] && (oldAttributes === newAttributes) && (mutationTarget.tagName != "INPUT")) {
                    return [State.WARNING, message]
                }
                let clonedTarget = mutationTarget.cloneNode(false)
                message = [`Attribute change:`, `Caused by: ${eventType}`,
                    `Old Attribute Value: ${oldAttributes}`, `New Attribute Value: ${newAttributes}`,
                    `Mutation Target: ${clonedTarget.outerHTML}`, `Mutation Attribute Name: ${mutationAttributeName}`]
                break;
            // Filter childList
            case "childList":
                let nodeName = mutations[0].target.nodeName
                let addedNodes = mutations[0].addedNodes
                let removedNodes = mutations[0].removedNodes
                if ((filter["headTitleFilter"]) && (nodeName == "HEAD" || nodeName == "TITLE")) {
                    return [State.WARNING, message]
                }
                if (addedNodes[0] && addedNodes[0].nodeName === "P" && addedNodes[0].hasAttribute("data-downEventFinder-windowopen")) {
                    message = [`Element uses the window.open() method`, `Caused by: ${eventType}`]
                    return [State.PROBLEM, message]
                }
                let addedNodesCopy = []
                let removedNodesCopy = []
                addedNodes.forEach((node) => {
                    if (node.nodeName === "#text" && node.parentElement) addedNodesCopy.push(node.parentElement.cloneNode(false).outerHTML)
                    else addedNodesCopy.push(node.outerHTML)
                })
                removedNodes.forEach((node) => {
                    if (node.nodeName === "#text") removedNodesCopy.push("text")
                    else removedNodesCopy.push(node.outerHTML)
                })
                message = [`Child List change:`, `Caused by: ${eventType}`,
                    `Added Nodes: ${addedNodesCopy}`, `Removed Nodes: ${removedNodesCopy}`, `Target Node Name: ${nodeName.toLowerCase()}`]
                break;
            // Filter character data
            case "characterData":
                let oldValue = mutations[0].oldValue
                let newValue = mutations[0].target.data
                if ((filter["sameCDFilter"]) && (oldValue == newValue)) {
                    return [State.WARNING, message]
                }
                message = [`Character Data change`, `Caused by: ${eventType}`,
                    `Old Value: ${oldValue.trim()}`, `New Value: ${newValue.trim()}`]
                break;
        }
        return [State.PROBLEM, message]
    }

    let firstValues = inputFormValues(formElements)
    interactWithDialog(htmlDialog, true)

    // Testing the elements for down events
    if (slowCheckbox) {
        // Slow test
        let i = 0
        controller = new AbortController()
        const signal = controller.signal
        let timeoutID
        let style = document.createElement('style')
        style.setAttribute("id", "styleElementDownEventFinder")
        style.innerHTML = `.elementWarningStylingDownEventFinder {
            border: 4px dashed ${primaryWarningColor} !important; 
            outline: 4px dashed ${secondaryWarningColor} !important;
        } 
        .elementProblemStylingDownEventFinder {
            border: 5px solid ${primaryProblemColor} !important; 
            outline: 5px solid ${secondaryProblemColor} !important;
        }`
        document.head.appendChild(style)
        let firstElement = document.querySelector(`[data-downEventFinder-id=${downEvents[i].elementId}]`)
        firstElement.setAttribute("style",
            `background-color: ${highlightBackgroundColor} !important; border: 4px solid ${highlightBorderColor} !important; transform: scale(1.2);`)
        await new Promise(resolve => {
            signal.addEventListener('abort', () => {
                clearTimeout(timeoutID)
                resolve()
                aborted = true
            })
            timeoutID = setTimeout(function loopThroughElements() {
                let element = document.querySelector(`[data-downEventFinder-id=${downEvents[i].elementId}]`)
                let elementTagName = element.tagName
                let eventListeners = downEvents[i].downEvent
                eventListeners = eventListeners.filter((item, index) => eventListeners.indexOf(item) === index)
                if (i + 1 < downEvents.length) {
                    document.querySelector(`[data-downEventFinder-id=${downEvents[i + 1].elementId}]`)
                        .setAttribute("style",
                            `background-color: ${highlightBackgroundColor} !important; border: 4px solid ${highlightBorderColor} !important; transform: scale(1.2);`)
                }
                element.scrollIntoView({ block: "center", inline: "center" })
                eventListeners.forEach(event => {
                    observer.observe(target, config)
                    switch (event) {
                        case "mousedown":
                            element.dispatchEvent(mousedown)
                            break;
                        case "touchstart":
                            element.dispatchEvent(touchstart)
                            break;
                        case "pointerdown":
                            element.dispatchEvent(pointerdown)
                            break;
                    }
                    let mutation = observer.takeRecords()
                    observer.disconnect()
                    let [state, message] = callback(mutation, event, eventListeners)
                    let completeElement = {
                        element: elementTagName,
                        elementId: downEvents[i].elementId,
                        eventListener: event,
                        visibility: !(getComputedStyle(element).display === "none"),
                        state: state
                    }
                    removeStyling(element)
                    if (state === State.PROBLEM && message[0].includes("window.open()")) completeElement.windowOpen = true
                    switch (state) {
                        case State.UNOBSERVABLE:
                            if (element.dataset.downEventFinderState != "problem" && element.dataset.downEventFinderState != "warning") {
                                element.setAttribute("data-downEventFinder-state", State.UNOBSERVABLE)
                                element.classList.add("elementWarningStylingDownEventFinder")
                            }
                            results.unobservableDownEvents.push(completeElement)
                            break;
                        case State.WARNING:
                            if (element.dataset.downEventFinderState != "problem") {
                                element.setAttribute("data-downEventFinder-state", State.WARNING)
                                element.classList.add("elementWarningStylingDownEventFinder")
                            }
                            results.warningDownEvents.push(completeElement)
                            break;
                        case State.PROBLEM:
                            element.setAttribute("data-downEventFinder-state", State.PROBLEM)
                            element.classList.add("elementProblemStylingDownEventFinder")
                            completeElement.problemMessage = message
                            results.problemDownEvents.push(completeElement)
                            break;
                    }
                    if (!element.hasAttribute("aria-label")) element.setAttribute("aria-label", `Down-Event Finder: ${state} Down-Event.`)
                })
                i++
                if (i < downEvents.length) timeoutID = setTimeout(loopThroughElements, speed)
                else resolve()
            }, speed)
        })
    } else {
        // Regular test
        downEvents.forEach(obj => {
            let element = document.querySelector(`[data-downEventFinder-id=${obj.elementId}]`)
            let elementTagName = element.tagName
            let eventListeners = obj.downEvent
            eventListeners = eventListeners.filter((item, index) => eventListeners.indexOf(item) === index)
            eventListeners.forEach(event => {
                observer.observe(target, config)
                switch (event) {
                    case "mousedown":
                        element.dispatchEvent(mousedown)
                        break;
                    case "touchstart":
                        element.dispatchEvent(touchstart)
                        break;
                    case "pointerdown":
                        element.dispatchEvent(pointerdown)
                        break;
                }
                let mutation = observer.takeRecords()
                observer.disconnect()
                let [state, message] = callback(mutation, event, eventListeners)
                let completeElement = {
                    element: elementTagName,
                    elementId: obj.elementId,
                    eventListener: event,
                    visibility: !(getComputedStyle(element).display === "none"),
                    state: state
                }
                if (state === State.PROBLEM && message[0].includes("window.open()")) completeElement.windowOpen = true
                switch (state) {
                    case State.UNOBSERVABLE:
                        if (element.dataset.downEventFinderState != "problem" && element.dataset.downEventFinderState != "warning")
                            element.setAttribute("data-downEventFinder-state", State.UNOBSERVABLE)
                        results.unobservableDownEvents.push(completeElement)
                        break;
                    case State.WARNING:
                        if (element.dataset.downEventFinderState != "problem") element.setAttribute("data-downEventFinder-state", State.WARNING)
                        results.warningDownEvents.push(completeElement)
                        break;
                    case State.PROBLEM:
                        element.setAttribute("data-downEventFinder-state", State.PROBLEM)
                        completeElement.problemMessage = message
                        results.problemDownEvents.push(completeElement)
                        break;
                }
                if (!element.hasAttribute("aria-label")) element.setAttribute("aria-label", `Down-Event Finder: ${state} Down-Event.`)
            })
        })
    }
    if (aborted) return
    // Iterate through all Down-Events and check whether the element can be found
    let allDownEvents = results.unobservableDownEvents.concat(results.warningDownEvents, results.problemDownEvents)
    for (let i = 0; i < allDownEvents.length; i++) {
        let elementId = allDownEvents[i].elementId
        let element = getElement(elementId)
        if (!element) allDownEvents[i].canBeFound = false
    }

    // Check whether form values have changed
    let secondValues = Array.from(formElements).map((input) => input.value)
    if (firstValues.length == secondValues.length) {
        for (let k = 0; k < formElements.length; k++) {
            if (firstValues[k] != secondValues[k]) {
                let elementId = "DownEventFinder-FormElement-" + k
                formElements[k].setAttribute("data-downEventFinder-form-id", elementId)
                results.formsChanged = true
                results.changedFormElements.push({ tagName: formElements[k].tagName.toLowerCase(), type: formElements[k].type, formId: elementId })
            }
        }
    } else results.formsChanged = true

    interactWithDialog(htmlDialog, false)
    
    return results
}

// Input temporary values into all input and textarea elements 
function inputFormValues(formElements) {
    let formValues = []
    for (let k = 0; k < formElements.length; k++) {
        switch (formElements[k].type) {
            case "password":
            case "search":
            case "tel":
            case "url":
            case "textarea":
            case "text":
                let tempText = "test" + k
                formElements[k].value = tempText
                formValues.push(tempText)
                break;
            case "range":
            case "number":
                let tempNum = "1"
                formElements[k].value = tempNum
                formValues.push(tempNum)
                break;
            case "date":
                let tempDate = "2000-01-01"
                formElements[k].value = tempDate
                formValues.push(tempDate)
                break;
            case "datetime-local":
                let tempDateLocal = "2000-01-01T20:00"
                formElements[k].value = tempDateLocal
                formValues.push(tempDateLocal)
                break;
            case "time":
                let tempTime = "00:00"
                formElements[k].value = tempTime
                formValues.push(tempTime)
                break;
            case "week":
                let tempWeek = "2000-W01"
                formElements[k].value = tempWeek
                formValues.push(tempWeek)
                break;
            case "month":
                let tempMonth = "2000-01"
                formElements[k].value = tempMonth
                formValues.push(tempMonth)
                break;
            case "email":
                let tempMail = "example@example.com"
                formElements[k].value = tempMail
                formValues.push(tempMail)
                break;
            case "color":
                let tempColor = "#ffffff"
                formElements[k].value = tempColor
                formValues.push(tempColor)
                break;
            case "button":
            case "submit":
            case "reset":
            case "radio":
            case "checkbox":
            case "hidden":
            case "file":
            case "image":
                let value = formElements[k].value
                formValues.push(value)
        }
    }
    return formValues
}

// Check whether dialog exists and open or close all of them
function interactWithDialog(htmlDialog, open) {
    if (htmlDialog.length > 0) {
        htmlDialog.forEach((dialog) => {
            dialog.close()
            if (open) dialog.showModal()
        })
    }
}

// Get element with down-event
function getElement(elementId) {
    const selector = `[data-downEventFinder-id=${elementId}]`
    let element = document.querySelector(selector)
    return element
}

// Abort slow test while it is running
function abortSlowTest() {
    if (typeof controller !== 'undefined') {
        controller.abort()
        let downEvents = document.body.querySelectorAll("[data-downEventFinder-id]")
        downEvents.forEach((element) => {
            removeStyling(element)
            element.classList.remove("elementProblemStylingDownEventFinder", "elementWarningStylingDownEventFinder")
        })
    }
}

// Remove the slow test styling
function removeStyling(element) {
    element.style.border = ""
    element.style.backgroundColor = ""
    element.style.transform = ""
}