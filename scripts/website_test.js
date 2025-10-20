async function testWebsite(checkboxes, filter, speed, colors, downEvents) {
    // Get important elements of the current website
    const State = Object.freeze({
        UNOBSERVABLE: "unobservable",
        WARNING: "warning",
        PROBLEM: "problem"
    })
    const formElements = document.body.querySelectorAll(`textarea, input`)
    const [primaryWarningColor, secondaryWarningColor, primaryProblemColor, secondaryProblemColor] = colors
    let results = {
        formsChanged: false,
        unobservableDownEvents: [],
        warningDownEvents: [],
        problemDownEvents: []
    }

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

    // Function for creating problem box and info
    function createCSS(element, eventType) {
        const shadowContainerBox = document.createElement("div")
        shadowContainerBox.classList.add("problemPointerArea")
        shadowContainerBox.style.display = "inline"

        // Create problem box
        let symbol = document.createElement("span")
        symbol.textContent = "\u2755"
        symbol.style.paddingRight = "5px"
        symbol.style.fontSize = "small"

        let pEvent = document.createElement("span")
        pEvent.textContent = `Element reacted to ${eventType} event`
        pEvent.style.color = "black"
        pEvent.style.fontFamily = "Arial"
        pEvent.style.fontSize = "small"
        pEvent.style.display = "inline"
        pEvent.style.paddingLeft = "5px"

        let divBox = document.createElement("div")
        divBox.style.backgroundColor = "white"
        divBox.style.border = "2px solid black"
        divBox.style.borderRadius = "6px"
        divBox.style.boxShadow = "-2px 2px 5px black"
        divBox.style.margin = "10px"
        divBox.style.padding = "5px"
        divBox.style.whiteSpace = "nowrap"
        divBox.style.zIndex = "9998"
        divBox.style.display = "inline"
        divBox.style.position = "relative"

        let button = document.createElement("button")
        button.classList.add("infoButton")
        button.textContent = "\u2139"
        button.style.borderRadius = "50%"
        button.style.marginLeft = "5px"
        button.style.padding = "1px 6px"
        button.style.backgroundColor = "lightgrey"

        divBox.appendChild(symbol)
        divBox.appendChild(pEvent)
        divBox.appendChild(button)

        // Attempting to add to shadow dom
        try {
            element.after(shadowContainerBox)
            const shadowBox = shadowContainerBox.attachShadow({ mode: "open" })
            shadowBox.appendChild(divBox)
            element.setAttribute("style", `outline: 5px solid ${primaryProblemColor} !important; border: 5px solid ${secondaryProblemColor} !important;`)
        } catch (error) {
            console.log("The following element caused a problem: ", element)
            console.error("Error:", error)
        }
    }

    // Callback function for the mutation observer and storing messages
    let problemMessages = []
    function callback(mutations, eventType) {
        if (mutations.length === 0) return State.UNOBSERVABLE
        switch (mutations[0].type) {
            case "attributes":
                // Filter attributes
                let oldAttributes = mutations[0].oldValue
                let newAttributes = mutations[0].target.getAttribute(mutations[0].attributeName)
                let mutationTarget = mutations[0].target
                let mutationAttributeName = mutations[0].attributeName

                if (filter["cssFilter"] && (mutationAttributeName === "class") && (getComputedStyle(mutationTarget).display != "none")) {
                    return State.WARNING
                }
                if (filter["ariaExpandedFilter"] && (mutationAttributeName === "aria-expanded")) {
                    return State.WARNING
                }
                if ((filter["cssFilter"]) && (mutationAttributeName === "style")) {
                    if (((oldAttributes) && !oldAttributes.includes("display")) || ((newAttributes) && !newAttributes.includes("display"))) {
                        return State.WARNING
                    }
                }
                if (filter["dataFilter"] && (mutationAttributeName.toUpperCase().includes("DATA"))) {
                    return State.WARNING
                }
                if (filter["falsyFilter"] && (!oldAttributes && !newAttributes) && (mutationTarget.tagName != "DIALOG") && (mutationTarget.tagName != "INPUT")) {
                    return State.WARNING
                }
                if (filter["sameAttributeFilter"] && (oldAttributes === newAttributes) && (mutationTarget.tagName != "INPUT")) {
                    return State.WARNING
                }
                let sanitizedTarget = mutationTarget.cloneNode(false)
                problemMessages.push([`Attribute change:`, `Caused by: ${eventType}`,
                    `Old Attribute Value: ${oldAttributes}`, `New Attribute Value: ${newAttributes}`,
                    `Mutation Target: ${sanitizedTarget.outerHTML}`, `Mutation Attribute Name: ${mutationAttributeName}`])
                break;
            case "childList":
                // Filter childList
                let nodeName = mutations[0].target.nodeName
                let addedNodes = mutations[0].addedNodes
                let removedNodes = mutations[0].removedNodes
                if ((filter["headTitleFilter"]) && (nodeName == "HEAD" || nodeName == "TITLE")) {
                    return State.WARNING
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
                problemMessages.push([`Child List change:`, `Caused by: ${eventType}`,
                    `Added Nodes: ${addedNodesCopy}`, `Removed Nodes: ${removedNodesCopy}`, `Target Node Name: ${nodeName.toLowerCase()}`])
                break;
            case "characterData":
                // Filter character data
                let oldValue = mutations[0].oldValue
                let newValue = mutations[0].target.data
                if ((filter["sameCDFilter"]) && (oldValue == newValue)) {
                    return State.WARNING
                }
                problemMessages.push([`Character Data change`, `Caused by: ${eventType}`,
                    `Old Value: ${oldValue.trim()}`, `New Value: ${newValue.trim()}`])
                break;
        }
        // console.log("Observed change!\nChange: ", mutations[0], "\nElement number: ", num, "\nTriggered by: ", eventType, "\nMutation Type: ", mutations[0].type)
        return State.PROBLEM
    }

    // Form element test
    let firstValues = []
    if (checkboxes["forms"]) {
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

    // Mark all elements with at least one down-event
    if (checkboxes["marking"]) {
        downEvents.forEach((obj) => {
            let element = document.querySelector(`[data-downEventsFinder-id=${obj.elementId}]`)
            element.setAttribute("style", `outline: 4px dashed ${secondaryWarningColor} !important; border: 4px dashed ${primaryWarningColor} !important;`)
        })
    }

    // Testing the elements for down events
    if (checkboxes["slow"]) {
        // Slow test
        let i = 0
        await new Promise(resolve => {
            function loopThroughElements() {
                setTimeout(() => {
                    let element = document.querySelector(`[data-downEventsFinder-id=${downEvents[i].elementId}]`)
                    let eventListeners = downEvents[i].downEvent
                    if (filter["multipleDownEvents"]) eventListeners = eventListeners.slice(0, 1)

                    element.scrollIntoView()
                    element.setAttribute("style", `outline: 5px solid ${primaryWarningColor} !important; border: 5px solid ${secondaryWarningColor} !important;`)

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
                        if (mutation.length > 0) callback(mutation, element, event)
                    })
                    i++

                    if (i < downEvents.length) loopThroughElements()
                    else resolve()
                }, speed)
            }
            loopThroughElements()
        })
    }
    else {
        // Regular test
        downEvents.forEach(obj => {
            let element = document.querySelector(`[data-downEventsFinder-id=${obj.elementId}]`)
            let elementTagName = element.tagName
            let eventListeners = obj.downEvent
            if (filter["multipleDownEvents"]) eventListeners = eventListeners.slice(0, 1)
            const completeElement = {
                element: elementTagName,
                dataId: obj.elementId,
                eventListeners: undefined,
                visibility: !(getComputedStyle(element).display === "none"),
                state: undefined
            }
            
            eventListeners.forEach(event => {
                completeElement.eventListeners = event
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
                let state = callback(mutation, element, event)
                switch (state) {
                    case State.UNOBSERVABLE:
                        results.unobservableDownEvents.push(completeElement)
                        break;
                    case State.WARNING:        
                        results.warningDownEvents.push(completeElement)
                        break;
                    case State.PROBLEM:
                        createCSS(element, event)
                        results.problemDownEvents.push(completeElement)
                        break;
                }
                completeElement.state = state
            })
        })
    }

    // Check whether nodes have been deleted
    if (document.querySelectorAll(".problemPointerArea").length != results.problemDownEvents.length) {
        let warning = document.createElement("h1")
        warning.textContent = "Down-Events Finder - Warning: Nodes have been deleted or changed!"
        warning.style.textAlign = "center"
        warning.style.background = "white"
        warning.style.color = "red"
        warning.style.fontFamily = "Arial"
        warning.style.fontSize = "xx-large"
        try {
            document.body.prepend(warning)
        } catch (error) {
            console.error("Error prepending warning to website:", error)
        }
    }

    // Check whether form values have changed
    if (checkboxes["forms"]) {
        let secondValues = Array.from(formElements).map((input) => input.value)
        //console.log("First values:", firstValues)
        //console.log("Second values:", secondValues)
        if (firstValues.length == secondValues.length) {
            for (let k = 0; k < formElements.length; k++) {
                if (firstValues[k] != secondValues[k]) {
                    formElements[k].setAttribute("style", `outline: 5px dotted ${primaryProblemColor} !important; border: 5px dotted ${secondaryProblemColor} !important;`)
                    let elementId = "DownEventsFinder-FormElement-" + k
                    formElements[k].setAttribute("data-downEventsFinder-form-id", elementId)
                    results.formsChanged = true
                }
            }
        } else {
            results.formsChanged = true
        }
        if (results.formsChanged) {
            [...formElements].filter((input) => input.type === "file")
                .forEach((element) => { element.setAttribute("style", `outline: 5px dotted ${primaryWarningColor} !important; border: 5px dotted ${secondaryWarningColor} !important;`) })
        }
    }

    if (results.problemDownEvents.length > 0) {
        // Create info 
        const shadowContainerHelp = document.createElement("div")

        let divHelp = document.createElement("div")
        divHelp.style.display = "none"
        divHelp.style.background = "white"
        divHelp.style.height = "200px"
        divHelp.style.width = "400px"
        divHelp.style.overflowY = "scroll"
        divHelp.style.position = "absolute"
        divHelp.style.zIndex = "9999"
        divHelp.style.boxShadow = "0px 0px 8px black"

        let hr = document.createElement("hr")
        divHelp.appendChild(hr)

        let span = document.createElement("span")
        span.textContent = "Please consider carefully whether the event violates the WCAG success criterion 2.5.2. The following down-events are allowed:"
        span.style.color = "black"
        span.style.fontFamily = "Arial"
        span.style.fontSize = "small"
        divHelp.appendChild(span)

        let ul = document.createElement("ul")
        divHelp.appendChild(ul)

        let liAbort = document.createElement("li")
        liAbort.style.color = "black"
        liAbort.style.fontFamily = "Arial"
        liAbort.style.fontSize = "small"
        liAbort.textContent = "Abort or Undo: Can the event be aborted or undone?"

        let liReversal = document.createElement("li")
        liReversal.style.color = "black"
        liReversal.style.fontFamily = "Arial"
        liReversal.style.fontSize = "small"
        liReversal.textContent = "Reversal: Does the up-event reverse the preceding down-event?"

        let liEssential = document.createElement("li")
        liEssential.style.color = "black"
        liEssential.style.fontFamily = "Arial"
        liEssential.style.fontSize = "small"
        liEssential.textContent = "Essential: Is it essential that the down-event is used? (e.g. on-screen keyboard)"

        ul.appendChild(liAbort)
        ul.appendChild(liReversal)
        ul.appendChild(liEssential)

        // Event handler for button
        let z = 0
        for (const { shadowRoot } of document.querySelectorAll("div.problemPointerArea")) {
            let button = shadowRoot.querySelector("div button.infoButton")
            let problemList = document.createElement("ul")
            problemList.style.fontFamily = "Arial"
            problemList.style.fontSize = "small"
            problemList.classList.add("problemPointerAreaText")
            problemMessages[z].forEach((text) => {
                let problemText = document.createElement("li")
                problemText.textContent = text
                problemList.appendChild(problemText)
            })
            button.addEventListener("click", () => {
                if (divHelp.querySelectorAll(".problemPointerAreaText").length != 0) {
                    divHelp.querySelectorAll(".problemPointerAreaText").forEach((element) => element.remove())
                }
                if (divHelp.style.display == "none") {
                    divHelp.prepend(problemList)
                    divHelp.style.display = "block"
                    divHelp.style.left = (button.parentNode.getBoundingClientRect().right + window.scrollX) + "px"
                    divHelp.style.top = (button.parentNode.getBoundingClientRect().bottom + window.scrollY) + "px"
                } else if (divHelp.style.display == "block") {
                    divHelp.style.display = "none"
                }
            })
            z++
        }
        try {
            document.body.appendChild(shadowContainerHelp)
            const shadowHelp = shadowContainerHelp.attachShadow({ mode: "open" })
            shadowHelp.appendChild(divHelp)
        } catch (error) {
            console.error(error)
        }
    }

    // Close dialogs 
    if (htmlDialog.length > 0) htmlDialog.forEach((dialog) => dialog.close())

    // console.log("Results:", results)
    return results
}