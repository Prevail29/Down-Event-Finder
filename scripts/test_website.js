// Get the textarea and input elements of a website
const formElements = document.body.querySelectorAll(`textarea, input`)

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

async function testWebsite(filter, slowValues, colors, downEvents) {
    // Get important elements of the current website  
    const [primaryWarningColor, secondaryWarningColor, primaryProblemColor, secondaryProblemColor, highlightBackgroundColor, highlightBorderColor] = colors
    const [slowCheckbox, speed] = slowValues
    if (downEvents.length === 0) return results

    // Create mutation observer
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
    
    // Callback function for the mutation observer and storing messages
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
                let sanitizedTarget = mutationTarget.cloneNode(false)
                message = [`Attribute change:`, `Caused by: ${eventType}`,
                    `Old Attribute Value: ${oldAttributes}`, `New Attribute Value: ${newAttributes}`,
                    `Mutation Target: ${sanitizedTarget.outerHTML}`, `Mutation Attribute Name: ${mutationAttributeName}`]
                break;
            // Filter childList
            case "childList":
                let nodeName = mutations[0].target.nodeName
                let addedNodes = mutations[0].addedNodes
                let removedNodes = mutations[0].removedNodes
                if ((filter["headTitleFilter"]) && (nodeName == "HEAD" || nodeName == "TITLE")) {
                    return [State.WARNING, message]
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
        // console.log("Observed change!\nChange: ", mutations[0], "\nElement number: ", num, "\nTriggered by: ", eventType, "\nMutation Type: ", mutations[0].type)
        return [State.PROBLEM, message]
    }

    // Form element test
    let firstValues = []
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
                firstValues.push(tempText)
                break;
            case "range":
            case "number":
                let tempNum = "1"
                formElements[k].value = tempNum
                firstValues.push(tempNum)
                break;
            case "date":
                let tempDate = "2000-01-01"
                formElements[k].value = tempDate
                firstValues.push(tempDate)
                break;
            case "datetime-local":
                let tempDateLocal = "2000-01-01T20:00"
                formElements[k].value = tempDateLocal
                firstValues.push(tempDateLocal)
                break;
            case "time":
                let tempTime = "00:00"
                formElements[k].value = tempTime
                firstValues.push(tempTime)
                break;
            case "week":
                let tempWeek = "2000-W01"
                formElements[k].value = tempWeek
                firstValues.push(tempWeek)
                break;
            case "month":
                let tempMonth = "2000-01"
                formElements[k].value = tempMonth
                firstValues.push(tempMonth)
                break;
            case "email":
                let tempMail = "example@example.com"
                formElements[k].value = tempMail
                firstValues.push(tempMail)
                break;
            case "color":
                let tempColor = "#ffffff"
                formElements[k].value = tempColor
                firstValues.push(tempColor)
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
                firstValues.push(value)
        }
    }

    // Check whether dialog exists and if yes, open all of them
    let htmlDialog = document.querySelectorAll("dialog")
    if (htmlDialog.length > 0) {
        htmlDialog.forEach((dialog) => {
            try {
                dialog.close()
                dialog.showModal()
            } catch (error) {
                console.error("Error opening the dialog: ", error)
            }
        })
    }

    // Testing the elements for down events
    if (slowCheckbox) {
        // Slow test
        let i = 0
        let firstElement = document.querySelector(`[data-downeventsfinder-id=${downEvents[i].elementId}]`)
        firstElement.setAttribute("style", 
            `background-color: ${highlightBackgroundColor} !important; border: 4px solid ${highlightBorderColor} !important; transform: scale(1.2);`)
        await new Promise(resolve => setTimeout(function loopThroughElements() {
            let element = document.querySelector(`[data-downeventsfinder-id=${downEvents[i].elementId}]`)
            let elementTagName = element.tagName
            let eventListeners = downEvents[i].downEvent
            eventListeners = eventListeners.filter((item, index) => eventListeners.indexOf(item) === index)
            if (i + 1 < downEvents.length) {
                document.querySelector(`[data-downeventsfinder-id=${downEvents[i + 1].elementId}]`)
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
                    dataId: downEvents[i].elementId,
                    eventListener: event,
                    visibility: !(getComputedStyle(element).display === "none"),
                    state: state
                }
                switch (state) {
                    case State.UNOBSERVABLE:
                        if (element.dataset.downeventsfinderState != "problem" && element.dataset.downeventsfinderState != "warning") {
                            element.setAttribute("data-downeventsfinder-state", State.UNOBSERVABLE)
                            element.setAttribute("style", `border: 4px dashed ${primaryWarningColor} !important; outline: 4px dashed ${secondaryWarningColor} !important;`)
                        }
                        results.unobservableDownEvents.push(completeElement)
                        break;
                    case State.WARNING:
                        if (element.dataset.downeventsfinderState != "problem") {
                            element.setAttribute("data-downeventsfinder-state", State.WARNING)
                            element.setAttribute("style", `border: 4px dashed ${primaryWarningColor} !important; outline: 4px dashed ${secondaryWarningColor} !important;`)
                        }
                        results.warningDownEvents.push(completeElement)
                        break;
                    case State.PROBLEM:
                        element.setAttribute("data-downeventsfinder-state", State.PROBLEM)
                        element.setAttribute("style", `border: 5px solid ${primaryProblemColor} !important; outline: 5px solid ${secondaryProblemColor} !important;`)
                        completeElement.problemMessage = message
                        results.problemDownEvents.push(completeElement)
                        break;
                }
            })
            i++
            if (i < downEvents.length) setTimeout(loopThroughElements, speed)
            else resolve()
        }, speed))
    }
    else {
        // Regular test
        downEvents.forEach(obj => {
            let element = document.querySelector(`[data-downeventsfinder-id=${obj.elementId}]`)
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
                    dataId: obj.elementId,
                    eventListener: event,
                    visibility: !(getComputedStyle(element).display === "none"),
                    state: state
                }
                switch (state) {
                    case State.UNOBSERVABLE:
                        if (element.dataset.downeventsfinderState != "problem" && element.dataset.downeventsfinderState != "warning")
                            element.setAttribute("data-downeventsfinder-state", State.UNOBSERVABLE)
                        results.unobservableDownEvents.push(completeElement)
                        break;
                    case State.WARNING:
                        if (element.dataset.downeventsfinderState != "problem") element.setAttribute("data-downeventsfinder-state", State.WARNING)
                        results.warningDownEvents.push(completeElement)
                        break;
                    case State.PROBLEM:
                        element.setAttribute("data-downeventsfinder-state", State.PROBLEM)
                        completeElement.problemMessage = message
                        results.problemDownEvents.push(completeElement)
                        break;
                }
            })
        })
    }

    // Iterate through all Down-Events and check whether the element can be found
    let allDownEvents = results.unobservableDownEvents.concat(results.warningDownEvents, results.problemDownEvents)
    for (let i = 0; i < allDownEvents.length; i++) {
        let id = allDownEvents[i].dataId
        let element = document.querySelector(`[data-downeventsfinder-id='${id}']`)
        if (!element) {
            let warning = document.createElement("h1")
            warning.textContent = "Down-Events Finder - Warning: Nodes have been deleted or changed!"
            warning.style.textAlign = "center"
            warning.style.background = "white"
            warning.style.color = "red"
            warning.style.fontFamily = "Arial"
            warning.style.fontSize = "xx-large"
            document.body.prepend(warning)
        }
    }

    // Check whether form values have changed
    let secondValues = Array.from(formElements).map((input) => input.value)
    if (firstValues.length == secondValues.length) {
        for (let k = 0; k < formElements.length; k++) {
            if (firstValues[k] != secondValues[k]) {
                let elementId = "DownEventsFinder-FormElement-" + k
                formElements[k].setAttribute("data-downeventsfinder-form-id", elementId)
                results.formsChanged = true
                results.changedFormElements.push({ tagName: formElements[k].tagName.toLowerCase(), type: formElements[k].type, formId: elementId })
            }
        }
    } else results.formsChanged = true

    // Close dialogs
    if (htmlDialog.length > 0) htmlDialog.forEach((dialog) => dialog.close())
    return results
}