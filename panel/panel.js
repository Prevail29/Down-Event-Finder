let elementsWithDownEvents = undefined
let allDownEvents = undefined

// Add event listeners to buttons
document.getElementById("initiateButton").addEventListener("click", getDownEventElements)
document.getElementById("iterateHighlightButton").addEventListener("click", iterativelyHighlightElements)
document.getElementById("slow").addEventListener("click", showTestingSpeed)
document.getElementById("checkAll").addEventListener("click", checkAllFilter)

document.getElementById("mousedownResults").addEventListener("click", (event) => displayDownEvents(event, "mousedown", getColors()))
document.getElementById("pointerdownResults").addEventListener("click", (event) => displayDownEvents(event, "pointerdown", getColors()))
document.getElementById("touchstartResults").addEventListener("click", (event) => displayDownEvents(event, "touchstart", getColors()))

document.getElementById("problemResult").addEventListener("click", (event) => displayState(event, "problem", getColors()))
document.getElementById("warningResult").addEventListener("click", (event) => displayState(event, "warning", getColors()))
document.getElementById("unobservableResult").addEventListener("click", (event) => displayState(event, "unobservable", getColors()))

document.getElementById("formResults").addEventListener("click", (event) => displayFormMarkings(event, getColors()))

// Functions for panel
function showTestingSpeed() {
    let checkbox = document.getElementById("slow").checked
    let testingSpeedField = document.querySelector("fieldset div")
    if (checkbox) {
        testingSpeedField.classList.remove("hidden")
    } else {
        testingSpeedField.classList.add("hidden")
    }
}

// Function for checking / unchecking all filters at once 
function checkAllFilter() {
    let allFilter = document.querySelectorAll('div details.filter input:not([id*="checkAll"])')
    if (document.getElementById("checkAll").checked) {
        allFilter.forEach((checkbox) => checkbox.checked = true)
    } else {
        allFilter.forEach((checkbox) => checkbox.checked = false)
    }
}

// Get values from panel
function getColors() {
    let colorWarningP = document.getElementById("primaryWarningColor").value
    let colorWarningS = document.getElementById("secondaryWarningColor").value
    let colorProblemP = document.getElementById("primaryProblemColor").value
    let colorProblemS = document.getElementById("secondaryProblemColor").value
    return [colorWarningP, colorWarningS, colorProblemP, colorProblemS]
}

function getInputSpeed() {
    let speed = document.getElementById("speed").value
    return speed
}

function getCheckboxValues() {
    let checkboxes = {
        forms: document.getElementById("form").checked,
        slow: document.getElementById("slow").checked,
    }
    return checkboxes
}

function getFilter() {
    let filters = {
        multipleDownEvents: document.getElementById("multipleDownEvents").checked,
        cssFilter: document.getElementById("cssFilter").checked,
        falsyFilter: document.getElementById("falsyFilter").checked,
        sameAttributeFilter: document.getElementById("sameAttributeFilter").checked,
        ariaExpandedFilter: document.getElementById("ariaExpandedFilter").checked,
        dataFilter: document.getElementById("dataFilter").checked,
        headTitleFilter: document.getElementById("headTitleFilter").checked,
        sameCDFilter: document.getElementById("sameCDFilter").checked
    }
    return filters
}

// Boolean if test has already been run once on website
let testRan = false

// Retrieve all down-events from website
function getDownEventElements() {
    if (testRan) console.log("Test already ran!")
    else {
        chrome.devtools.inspectedWindow.eval(`(function(){
            let id = 1
            let downEvents = []
            let allElements = document.body.querySelectorAll("*")
            allElements.forEach((element) => {
                let eventListeners = [
                    ...Object.values(getEventListeners(element))
                        .flat()
                        .map(obj => obj["type"])
                        .filter(type => type === "mousedown" || type === "pointerdown" || type === "touchstart")
                ]
                if (eventListeners.length > 0) {
                    let elementId = 'DownEventsFinder-' + id
                    element.setAttribute("data-downEventsFinder-id", elementId)
                    downEvents.push({ downEvent: eventListeners, elementId: elementId})
                    id++
                }
            })
            return downEvents
        })()`, (result, error) => {
            if (error) {
                console.error("Error:", error)
            } else {
                console.log("Results:", result)
                elementsWithDownEvents = result
                initiateTest(result)
                testRan = true
            }
        })
    }
}

// Test website for changes 
function initiateTest(downEvents) {
    chrome.scripting.executeScript({
        target: { tabId: chrome.devtools.inspectedWindow.tabId },
        files: ["./scripts/website_test.js"]
    }, () => {
        chrome.scripting.executeScript({
            target: { tabId: chrome.devtools.inspectedWindow.tabId },
            args: [getCheckboxValues(), getFilter(), getInputSpeed(), getColors(), downEvents],
            func: (...args) => testWebsite(...args)
        }).then((results) => {
            const elementsWithDownEventsLength = downEvents.length
            const eventListenersSum = downEvents.map(({ downEvent }) => downEvent).flat().length
            const formsChanged = results[0].result.formsChanged
            const changedFormElements = results[0].result.changedFormElements
            const unobservableDownEvents = results[0].result.unobservableDownEvents
            const warningDownEvents = results[0].result.warningDownEvents
            const problemDownEvents = results[0].result.problemDownEvents
            const totalDownEvents = unobservableDownEvents.length + warningDownEvents.length + problemDownEvents.length
            allDownEvents = unobservableDownEvents.concat(warningDownEvents, problemDownEvents)

            console.log("Unobservable Down-Events: ", unobservableDownEvents)
            console.log("Warning Down-Events: ", warningDownEvents)
            console.log("Problem Down-Events: ", problemDownEvents)

            let resultNode = document.getElementsByClassName("testResults")[0]
            let h3 = document.createElement("h3")

            if (elementsWithDownEventsLength === 0 || elementsWithDownEventsLength == undefined) {
                h3.textContent = "Website does not have any down-events!"
                resultNode.appendChild(h3)
            } else {
                document.getElementById("iterateHighlightButton").classList.remove("hidden")
                document.getElementById("results").classList.remove("hidden")
                h3.textContent = `This Website has ${elementsWithDownEventsLength} element${elementsWithDownEventsLength === 1 ? "" : "s"} causing 
                                  ${totalDownEvents} down-event${totalDownEvents === 1 ? "" : "s"}.`
                resultNode.appendChild(h3)

                if (formsChanged) {
                    let formDiv = document.createElement("div")
                    formDiv.id = ("changedFormsList")
                    let h4Forms = document.createElement("h4")
                    let formList = document.createElement("ol")
                    h4Forms.textContent = "Form Elements changed!"
                    h4Forms.style.color = "red"
                    resultNode.appendChild(formDiv)
                    formDiv.appendChild(h4Forms)
                    formDiv.appendChild(formList)
                    let formResultsCheckbox = document.getElementById("formResults")
                    formResultsCheckbox.style.display = ""
                    formResultsCheckbox.previousElementSibling.style.display = ""
                    formResultsCheckbox.nextElementSibling.style.display = ""
                    changedFormElements.forEach((obj) => {
                        let li = document.createElement("li")
                        li.textContent = obj.tagName
                        if (obj.tagName === "input") li.textContent += " (File Type: " + obj.type + ")"
                        li.addEventListener("click", () => {
                            chrome.devtools.inspectedWindow.eval(`(function(){
                                const element = document.querySelector('[data-downeventsfinder-form-id=${obj.formId}]')
                                inspect(element)
                                element.scrollIntoView()})()`, (result, error) => {
                                if (error) {
                                    console.log(error)
                                    window.alert("Element was not found in DOM!")
                                }
                            })
                        })
                        formList.appendChild(li)
                    })
                }

                if (eventListenersSum > totalDownEvents) {
                    let duplicateEventListeners = eventListenersSum - totalDownEvents
                    h4Duplicates = document.createElement("h4")
                    h4Duplicates.textContent = `${duplicateEventListeners} duplicate down-events were cut`
                    resultNode.appendChild(h4Duplicates)
                }

                let divUnobservable = document.createElement("div")
                divUnobservable.id = "resultsUnobservable"
                let h4Unobservable = document.createElement("h4")
                h4Unobservable.textContent = `${unobservableDownEvents.length} down-event${unobservableDownEvents.length === 1 ? " was" : "s were"} unobservable`
                divUnobservable.appendChild(h4Unobservable)
                let listUnobservable = document.createElement("ol")

                let divWarning = document.createElement("div")
                divWarning.id = "resultsWarning"
                let h4Warning = document.createElement("h4")
                h4Warning.textContent = `${warningDownEvents.length} down-event${warningDownEvents.length === 1 ? "" : "s"} caused minor changes`
                divWarning.appendChild(h4Warning)
                let listWarning = document.createElement("ol")

                let divProblem = document.createElement("div")
                divProblem.id = "resultsProblem"
                let h4Problem = document.createElement("h4")
                h4Problem.textContent = `${problemDownEvents.length} down-event${problemDownEvents.length === 1 ? "" : "s"} caused problems`
                divProblem.appendChild(h4Problem)
                let listProblem = document.createElement("ol")

                allDownEvents.forEach((obj) => {
                    let li = document.createElement("li")
                    li.classList.add("resultListEntry")
                    let trimmedId = obj.dataId.replace(/\D/g, "")
                    li.textContent = obj.element.toLowerCase() + " (Down-Event: " + obj.eventListener + "; Element-ID: " + trimmedId + ")."
                    if (!obj.visibility) {
                        let invisibleHintText = document.createElement("b")
                        invisibleHintText.textContent = ' Element has "display:none".'
                        li.appendChild(invisibleHintText)
                    }
                    chrome.devtools.inspectedWindow.eval(`(function(){
                                const element = document.querySelector('[data-downEventsFinder-id=${obj.dataId}]')
                                if(element) return true
                                else return false})()`, (result, error) => {
                        if (error) {
                            console.log(error)
                        } else {
                            if (!result) {
                                let notExisitingText = document.createElement("b")
                                notExisitingText.textContent += ' Element is not in DOM!'
                                notExisitingText.style.color = "red"
                                li.appendChild(notExisitingText)
                            }
                        }
                    })
                    li.addEventListener("click", () => {
                        chrome.devtools.inspectedWindow.eval(`(function(){
                                const element = document.querySelector('[data-downEventsFinder-id=${obj.dataId}]')
                                inspect(element)
                                element.scrollIntoView()})()`, (result, error) => {
                            if (error) {
                                console.log(error)
                                window.alert("Element was not found in DOM!")
                            }
                        })
                    })
                    switch (obj.state) {
                        case "unobservable":
                            listUnobservable.appendChild(li)
                            break;
                        case "warning":
                            listWarning.appendChild(li)
                            break;
                        case "problem":
                            listProblem.appendChild(li)
                            break;
                    }
                })
                divUnobservable.appendChild(listUnobservable)
                divWarning.appendChild(listWarning)
                divProblem.appendChild(listProblem)

                resultNode.append(divUnobservable, divWarning, divProblem)
            }
        })
    })
}

// Change the results depending on the selected state
function displayState(event, checkboxState, colors) {
    const checkbox = event.srcElement.checked
    const checkboxProblem = document.getElementById("problemResult").checked
    const checkboxWarning = document.getElementById("warningResult").checked
    const checkboxUnobservable = document.getElementById("unobservableResult").checked
    const checkboxMousedown = document.getElementById("mousedownResults").checked
    const checkboxPointerdown = document.getElementById("pointerdownResults").checked
    const checkboxTouchstart = document.getElementById("touchstartResults").checked
    const [primaryWarningColor, secondaryWarningColor, primaryProblemColor, secondaryProblemColor] = colors
    let groupedDownEvents = Object.groupBy(allDownEvents, ({ dataId }) => dataId)
    if (checkbox) {
        chrome.devtools.inspectedWindow.eval(`(function(){
            let elements = ${JSON.stringify(groupedDownEvents)}
            for (const [key, value] of Object.entries(elements)) {
                let selector = '[data-downEventsFinder-id=' + key + ']'
                const element = document.querySelector(selector)
                if(value.some((obj) => obj.state === "${checkboxState}")){
                    let styleAttribute = 'border: 4px dashed ${primaryWarningColor} !important; outline: 4px dashed ${secondaryWarningColor} !important'
                    let filteredEventListeners = value.filter((obj) => obj.state === "${checkboxState}")
                                                      .map(obj => obj.eventListener)
                    if("${checkboxState}" === "problem"){
                        styleAttribute = 'border: 5px solid ${primaryProblemColor} !important; outline: 5px solid ${secondaryProblemColor} !important;'
                        filteredEventListeners.forEach((eventListener) => {
                            switch(eventListener){
                                case "touchstart":
                                    if(${checkboxTouchstart}){
                                        let problemInfoBoxElement = element.nextElementSibling
                                        element.setAttribute("style", styleAttribute)
                                        problemInfoBoxElement.style.display = "inline"
                                    }
                                    break;
                                case "pointerdown":
                                    if(${checkboxPointerdown}){
                                        let problemInfoBoxElement = element.nextElementSibling
                                        element.setAttribute("style", styleAttribute)
                                        if (filteredEventListeners.includes("touchstart")) problemInfoBoxElement = element.nextElementSibling.nextElementSibling
                                        problemInfoBoxElement.style.display = "inline"
                                    }
                                    break;
                                case "mousedown":
                                    if(${checkboxMousedown}){
                                        let problemInfoBoxElement = element.nextElementSibling
                                        element.setAttribute("style", styleAttribute)
                                        if (filteredEventListeners.length === 2) problemInfoBoxElement = element.nextElementSibling.nextElementSibling
                                        if (filteredEventListeners.length === 3) problemInfoBoxElement = element.nextElementSibling.nextElementSibling.nextElementSibling
                                        problemInfoBoxElement.style.display = "inline"
                                    }
                                    break;
                            }
                        })
                    } else {
                        let problemElements = [] 
                        let displayProblem = false
                        value.forEach((element) => {
                            if(element.state === "problem") problemElements.push(element.eventListener)
                        })
                        if(problemElements.length > 0 && ${checkboxProblem}){
                            for (const eventListener of problemElements){
                                if (eventListener === "touchstart" && ${checkboxTouchstart}){
                                    displayProblem = true
                                    break;
                                } else if (eventListener === "pointerdown" && ${checkboxPointerdown}){
                                    displayProblem = true
                                    break;
                                } else if (eventListener === "mousedown" && ${checkboxMousedown}){
                                    displayProblem = true
                                    break;
                                } else displayProblem = false
                            }
                        }
                        if(!displayProblem){
                            filteredEventListeners.forEach((eventListener) => {
                                switch(eventListener){
                                    case "touchstart":
                                        if(${checkboxTouchstart}) element.setAttribute("style", styleAttribute)
                                        break;
                                    case "pointerdown":
                                        if(${checkboxPointerdown}) element.setAttribute("style", styleAttribute)
                                        break;
                                    case "mousedown":
                                        if(${checkboxMousedown}) element.setAttribute("style", styleAttribute)
                                        break;
                                }
                            })
                        } 
                    }
                }
            }
        })()`, (result, error) => {
            if (error) console.error("Error:", error)
        })
        let targetNode = undefined
        switch (checkboxState) {
            case "problem":
                targetNode = document.getElementById("resultsProblem")
                break;
            case "warning":
                targetNode = document.getElementById("resultsWarning")
                break;
            case "unobservable":
                targetNode = document.getElementById("resultsUnobservable")
                break;
        }
        targetNode.classList.remove("hidden")
    } else {
        chrome.devtools.inspectedWindow.eval(`(function(){
            let elements = ${JSON.stringify(groupedDownEvents)}
            for (const [key, value] of Object.entries(elements)) {
                let selector = '[data-downEventsFinder-id=' + key + ']'
                const element = document.querySelector(selector)
                if(value.some((obj) => obj.state === "${checkboxState}")){
                    if(value.length === 1){
                        element.setAttribute("style", "")
                    } else {
                        let problemElements = [] 
                        let warningElements = []
                        let unobservableElements = []
                        value.forEach((element) => {
                            switch(element.state){
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
                        let displayProblem = false
                        let displayWarning = false
                        let displayUnobservable = false
                        if(problemElements.length > 0 && ${checkboxProblem}){
                            for (const eventListener of problemElements){
                                if (eventListener === "touchstart" && ${checkboxTouchstart}){
                                    displayProblem = true
                                    break;
                                } else if (eventListener === "pointerdown" && ${checkboxPointerdown}){
                                    displayProblem = true
                                    break;
                                } else if (eventListener === "mousedown" && ${checkboxMousedown}){
                                    displayProblem = true
                                    break;
                                } else displayProblem = false
                            }
                        }
                        if(warningElements.length > 0 && ${checkboxWarning}){
                            for (const eventListener of warningElements){
                                if (eventListener === "touchstart" && ${checkboxTouchstart}){
                                    displayWarning = true
                                    break;
                                } else if (eventListener === "pointerdown" && ${checkboxPointerdown}){
                                    displayWarning = true
                                    break;
                                } else if (eventListener === "mousedown" && ${checkboxMousedown}){
                                    displayWarning = true
                                    break;
                                } else displayWarning = false
                            }
                        }
                        if(unobservableElements.length > 0 && ${checkboxUnobservable}){
                            for (const eventListener of unobservableElements){
                                if (eventListener === "touchstart" && ${checkboxTouchstart}){
                                    displayUnobservable = true
                                    break;
                                } else if (eventListener === "pointerdown" && ${checkboxPointerdown}){
                                    displayUnobservable = true
                                    break;
                                } else if (eventListener === "mousedown" && ${checkboxMousedown}){
                                    displayUnobservable = true
                                    break;
                                } else displayUnobservable = false
                            }
                        }
                        if("${checkboxState}" === "problem"){
                            let styleAttribute = 'border: 4px dashed ${primaryWarningColor} !important; outline: 4px dashed ${secondaryWarningColor} !important'
                            if(displayWarning || displayUnobservable) element.setAttribute("style", styleAttribute)
                            else element.setAttribute("style", "")
                        } 
                        if("${checkboxState}" === "warning") {
                            if(!displayProblem && !displayUnobservable) element.setAttribute("style", "")
                        }   
                        if("${checkboxState}" === "unobservable") {
                            if(!displayProblem && !displayWarning) element.setAttribute("style", "")
                        }
                    }
                }
            }
            if("${checkboxState}" === "problem"){
                let problemInfoBoxes = document.querySelectorAll('.problemInfoBox')
                if(problemInfoBoxes){
                    problemInfoBoxes.forEach((obj) => {
                        obj.style.display = "none"
                    })
                }
            }
        })()`, (result, error) => {
            if (error) console.error("Error:", error)
        })
        let targetNode = undefined
        switch (checkboxState) {
            case "problem":
                targetNode = document.getElementById("resultsProblem")
                break;
            case "warning":
                targetNode = document.getElementById("resultsWarning")
                break;
            case "unobservable":
                targetNode = document.getElementById("resultsUnobservable")
                break;
        }
        targetNode.classList.add("hidden")
    }
}

// Change the results depending on the selected down-event
function displayDownEvents(event, checkboxDownEvent, colors) {
    const checkbox = event.srcElement.checked
    const checkboxProblem = document.getElementById("problemResult").checked
    const checkboxWarning = document.getElementById("warningResult").checked
    const checkboxUnobservable = document.getElementById("unobservableResult").checked
    const checkboxMousedown = document.getElementById("mousedownResults").checked
    const checkboxPointerdown = document.getElementById("pointerdownResults").checked
    const checkboxTouchstart = document.getElementById("touchstartResults").checked
    const [primaryWarningColor, secondaryWarningColor, primaryProblemColor, secondaryProblemColor] = colors
    let groupedDownEvents = Object.groupBy(allDownEvents, ({ dataId }) => dataId)
    let resultListEntries = document.querySelectorAll(".resultListEntry")
    if (checkbox) {
        chrome.devtools.inspectedWindow.eval(`(function(){
            let elements = ${JSON.stringify(groupedDownEvents)} 
            for (const [key, value] of Object.entries(elements)) {
                let selector = '[data-downEventsFinder-id=' + key + ']'
                const element = document.querySelector(selector)
                if (value.some((obj) => obj.eventListener === "${checkboxDownEvent}")){
                    let styleAttribute = 'border: 4px dashed ${primaryWarningColor} !important; outline: 4px dashed ${secondaryWarningColor} !important'
                    let checkboxElementState = value.find((obj) => obj.eventListener === "${checkboxDownEvent}").state
                    if (value.length === 1){
                        if(checkboxElementState === "problem" && ${checkboxProblem}){
                            let problemInfoBoxElement = element.nextElementSibling
                            problemInfoBoxElement.style.display = "inline"
                            styleAttribute = 'border: 5px solid ${primaryProblemColor} !important; outline: 5px solid ${secondaryProblemColor} !important;'
                            element.setAttribute("style", styleAttribute)
                        } else if (checkboxElementState === "warning" && ${checkboxWarning}) element.setAttribute("style", styleAttribute)
                        else if (checkboxElementState === "unobservable" && ${checkboxUnobservable}) element.setAttribute("style", styleAttribute)
                    } else {
                        let otherProblemElements = [] 
                        value.forEach((element) => {
                            if (element.eventListener != "${checkboxDownEvent}" && element.state === "problem") otherProblemElements.push(element.eventListener)
                        })
                        if (checkboxElementState === "problem" && ${checkboxProblem}){
                            let problemInfoBoxElement = element.nextElementSibling
                            if (otherProblemElements.length > 0) {
                                switch ("${checkboxDownEvent}"){
                                    case "pointerdown":
                                        if (otherProblemElements.includes("touchstart")) problemInfoBoxElement = element.nextElementSibling.nextElementSibling
                                        break;
                                    case "mousedown":
                                        if (otherProblemElements.length === 2) problemInfoBoxElement = element.nextElementSibling.nextElementSibling.nextElementSibling
                                        else problemInfoBoxElement = element.nextElementSibling.nextElementSibling
                                        break;
                                }
                            }
                            styleAttribute = 'border: 5px solid ${primaryProblemColor} !important; outline: 5px solid ${secondaryProblemColor} !important;'
                            element.setAttribute("style", styleAttribute)
                            problemInfoBoxElement.style.display = "inline"
                        } else if (checkboxElementState != "problem") {
                            if (otherProblemElements.length === 0) {
                                if(checkboxElementState === "warning" && ${checkboxWarning}) element.setAttribute("style", styleAttribute)
                                else if(checkboxElementState === "unobservable" && ${checkboxUnobservable}) element.setAttribute("style", styleAttribute)
                            } else {   
                                let checkboxValues = []
                                otherProblemElements.forEach((event) => {
                                    switch (event){
                                        case "mousedown":
                                            checkboxValues.push(${checkboxMousedown})
                                            break;
                                        case "pointerdown":
                                            checkboxValues.push(${checkboxPointerdown})
                                            break;
                                        case "touchstart":
                                            checkboxValues.push(${checkboxTouchstart})
                                            break; 
                                    }
                                })
                                if (!${checkboxProblem} || (!checkboxValues[0] && (checkboxValues[1] === undefined || !checkboxValues[1]))){
                                    if(checkboxElementState === "warning" && ${checkboxWarning}) element.setAttribute("style", styleAttribute)
                                    else if(checkboxElementState === "unobservable" && ${checkboxUnobservable}) element.setAttribute("style", styleAttribute)
                                }
                            }
                        }
                    }
                } 
            }
        })()`, (result, error) => {
            if (error) console.error("Error:", error)
        })
        resultListEntries.forEach((obj) => {
            if (obj.innerHTML.indexOf(checkboxDownEvent) !== -1) obj.classList.remove("hidden")
        })
    } else {
        chrome.devtools.inspectedWindow.eval(`(function(){
            let elements = ${JSON.stringify(groupedDownEvents)}
            for (const [key, value] of Object.entries(elements)) {
                let selector = '[data-downEventsFinder-id=' + key + ']'
                const element = document.querySelector(selector)
                if (value.some((obj) => obj.eventListener === "${checkboxDownEvent}")){
                    let checkboxElementState = value.find((element) => element.eventListener === "${checkboxDownEvent}").state
                    if (value.length === 1){
                        element.setAttribute("style", "")
                        if(checkboxElementState === "problem"){
                            let problemInfoBoxElement = element.nextElementSibling
                            problemInfoBoxElement.style.display = "none"
                        }
                    } else {
                        let otherProblemElements = [] 
                        let otherWarningElements = []
                        let otherUnobservableElements = []
                        value.forEach((element) => {
                            if (element.eventListener != "${checkboxDownEvent}"){
                                switch(element.state){
                                    case "problem":
                                        otherProblemElements.push(element.eventListener)
                                        break;
                                    case "warning": 
                                        otherWarningElements.push(element.eventListener)
                                        break;
                                    case "unobservable":
                                        otherUnobservableElements.push(element.eventListener)
                                        break;
                                }
                            } 
                        })
                        let displayProblem = false
                        let displayWarning = false
                        let displayUnobservable = false
                        if(otherProblemElements.length > 0 && ${checkboxProblem}){
                            for (const eventListener of otherProblemElements){
                                if (eventListener === "touchstart" && ${checkboxTouchstart}){
                                    displayProblem = true
                                    break;
                                } else if (eventListener === "pointerdown" && ${checkboxPointerdown}){
                                    displayProblem = true
                                    break;
                                } else if (eventListener === "mousedown" && ${checkboxMousedown}){
                                    displayProblem = true
                                    break;
                                } else displayProblem = false
                            }
                        }
                        if(otherWarningElements.length > 0 && ${checkboxWarning}){
                            for (const eventListener of otherWarningElements){
                                if (eventListener === "touchstart" && ${checkboxTouchstart}){
                                    displayWarning = true
                                    break;
                                } else if (eventListener === "pointerdown" && ${checkboxPointerdown}){
                                    displayWarning = true
                                    break;
                                } else if (eventListener === "mousedown" && ${checkboxMousedown}){
                                    displayWarning = true
                                    break;
                                } else displayWarning = false
                            }
                        }
                        if(otherUnobservableElements.length > 0 && ${checkboxUnobservable}){
                            for (const eventListener of otherUnobservableElements){
                                if (eventListener === "touchstart" && ${checkboxTouchstart}){
                                    displayUnobservable = true
                                    break;
                                } else if (eventListener === "pointerdown" && ${checkboxPointerdown}){
                                    displayUnobservable = true
                                    break;
                                } else if (eventListener === "mousedown" && ${checkboxMousedown}){
                                    displayUnobservable = true
                                    break;
                                } else displayUnobservable = false
                            }
                        }
                        if (checkboxElementState === "problem"){
                            let problemInfoBoxElement = element.nextElementSibling
                            if (otherProblemElements.length === 0) {
                                if(displayWarning || displayUnobservable){
                                    let styleAttribute = 'border: 4px dashed ${primaryWarningColor} !important; outline: 4px dashed ${secondaryWarningColor} !important'
                                    element.setAttribute("style", styleAttribute)
                                } else element.setAttribute("style", "")
                            } else {
                                switch ("${checkboxDownEvent}"){
                                    case "pointerdown":
                                        if (otherProblemElements.includes("touchstart")) problemInfoBoxElement = element.nextElementSibling.nextElementSibling
                                        break;
                                    case "mousedown":
                                        if (otherProblemElements.length === 2) problemInfoBoxElement = element.nextElementSibling.nextElementSibling.nextElementSibling
                                        else problemInfoBoxElement = element.nextElementSibling.nextElementSibling
                                        break;
                                }
                                if(!displayProblem){
                                    if(displayWarning || displayUnobservable){
                                        let styleAttribute = 'border: 4px dashed ${primaryWarningColor} !important; outline: 4px dashed ${secondaryWarningColor} !important'
                                        element.setAttribute("style", styleAttribute)
                                    } else element.setAttribute("style", "")
                                } 
                            }
                            problemInfoBoxElement.style.display = "none"   
                        } else if (checkboxElementState === "warning"){
                            if(!displayProblem && !displayWarning && !displayUnobservable) element.setAttribute("style", "")
                        } else{
                            if(!displayProblem && !displayWarning && !displayUnobservable) element.setAttribute("style", "")
                        }
                    }
                } 
            }
        })()`, (result, error) => {
            if (error) console.error("Error:", error)
        })
        resultListEntries.forEach((obj) => {
            if (obj.innerHTML.indexOf(checkboxDownEvent) !== -1) obj.classList.add("hidden")
        })
    }
}

// Change the visibility of form markings
function displayFormMarkings(event, colors) {
    const checkbox = event.srcElement.checked
    const [primaryWarningColor, secondaryWarningColor, primaryProblemColor, secondaryProblemColor] = colors
    let changedFormsList = document.getElementById("changedFormsList")
    if (checkbox) {
        chrome.devtools.inspectedWindow.eval(`(function(){
            let targetFormElements = document.querySelectorAll('[data-downeventsfinder-form-id]')
            const fileInputs = Array.from(document.body.querySelectorAll('input')).filter((input) => input.type === "file")
            targetFormElements.forEach((element) => {
                element.setAttribute("style", "outline: 5px dotted ${primaryProblemColor} !important; border: 5px dotted ${secondaryProblemColor} !important;")
            })
            if(fileInputs){
                fileInputs.forEach((input) => {
                    input.setAttribute("style", "outline: 5px dotted ${primaryWarningColor} !important; border: 5px dotted ${secondaryWarningColor} !important;")    
                })
            }
        })()`, (result, error) => {
            if (error) console.error("Error:", error)
        })
        changedFormsList.classList.remove("hidden")
    } else {
        chrome.devtools.inspectedWindow.eval(`(function(){
            let targetFormElements = document.querySelectorAll('[data-downeventsfinder-form-id]')
            const fileInputs = Array.from(document.body.querySelectorAll('input')).filter((input) => input.type === "file")
            targetFormElements.forEach((element) => {
                element.setAttribute("style", "")
            })
            if(fileInputs){
                fileInputs.forEach((input) => {
                    input.setAttribute("style", "")    
                })
            }
        })()`, (result, error) => {
            if (error) console.error("Error:", error)
        })
        changedFormsList.classList.add("hidden")
    }
}

function iterativelyHighlightElements() {
    chrome.devtools.inspectedWindow.eval(`(function(){
            let i = 0
            let styleAttributes = []
            let downEvents = document.body.querySelectorAll("[data-downeventsfinder-id]")
            let problemInfoBoxes = document.querySelectorAll('.problemInfoBox')
            let speed = Number(window.prompt("Enter the speed (milliseconds)", 1000))
            while(isNaN(speed)){
                window.alert("Enter a valid number!")
                speed = Number(window.prompt("Enter the speed (milliseconds)"))
            }
            let elementOutline, elementBackground = undefined
            downEvents.forEach((obj) => {
                console.log(obj.style.cssText)
                styleAttributes.push(obj.style.cssText)
                obj.setAttribute("style", "")
            })
            if(problemInfoBoxes){
                problemInfoBoxes.forEach((obj) => obj.style.display = "none")
            }
            function highlightElements(){
                if (i > 0) {
                    downEvents[i - 1].style.outline = ""
                    downEvents[i - 1].style.backgroundColor = ""
                    downEvents[i - 1].style.transform = ""
                }
                if (i < downEvents.length){
                    let element = downEvents[i]
                    element.style.outline = "4px solid purple"
                    element.style.backgroundColor = "#FDFF47"
                    element.style.transform = "scale(1.2)"
                    element.scrollIntoView({block: "center", inline: "center"})
                    i++
                    setTimeout(highlightElements, speed)
                } else {
                    downEvents.forEach((obj) => {
                        obj.setAttribute("style", styleAttributes[0])
                        styleAttributes.shift()
                    })
                    if(problemInfoBoxes){
                        problemInfoBoxes.forEach((obj) => obj.style.display = "inline")
                    }
                    window.alert("Finished highlighting elements!")
                }
            }
            highlightElements()
        })()`, (result, error) => {
            if (error) {
                console.error("Error:", error)
            } else {
                
            }
        }
    )
}