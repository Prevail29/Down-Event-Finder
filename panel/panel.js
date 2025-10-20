let allDownEvents = undefined

// Add event listeners to buttons
document.getElementById("initiateButton").addEventListener("click", getDownEventElements)
document.getElementById("slow").addEventListener("click", showTestingSpeed)
document.getElementById("checkAll").addEventListener("click", checkAllFilter)
document.getElementById("mousedownResults").addEventListener("click", (event) => displayDownEvents(event, "mousedown", getColors()))
document.getElementById("pointerdownResults").addEventListener("click", (event) => displayDownEvents(event, "pointerdown", getColors()))
document.getElementById("touchstartResults").addEventListener("click", (event) => displayDownEvents(event, "touchstart", getColors()))
document.getElementById("formResults").addEventListener("click", (event) => displayFormMarkings(event, getColors()))
document.getElementById("warningsResult").addEventListener("click", (event) => displayOnlyWarnings(event, getColors()))

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
        marking: document.getElementById("marking").checked,
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
            const elementsWithDownEvents = downEvents.length
            const formsChanged = results[0].result.formsChanged
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

            if (elementsWithDownEvents === 0 || elementsWithDownEvents == undefined) {
                h3.textContent = "Website does not have any down-events!"
                resultNode.appendChild(h3)
            } else {
                document.getElementsByClassName("displayResultsSettings")[0].style.display = ""
                h3.textContent = `This Website has ${elementsWithDownEvents} element${elementsWithDownEvents === 1 ? "" : "s"} causing 
                                  ${totalDownEvents} down-event${totalDownEvents === 1 ? "" : "s"}.`
                resultNode.appendChild(h3)

                if (formsChanged) {
                    h4Forms = document.createElement("h4")
                    h4Forms.textContent = "Forms changed on this website"
                    h4Forms.style.color = "red"
                    resultNode.appendChild(h4Forms)
                    let formResultsCheckbox = document.getElementById("formResults")
                    formResultsCheckbox.style.display = ""
                    formResultsCheckbox.nextElementSibling.style.display = ""  
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
                h4Problem.textContent = `${problemDownEvents.length} down-event${problemDownEvents.length === 1 ? "" : "s"} caused problems${problemDownEvents.length === 0 ? "" : ":"}`
                divProblem.appendChild(h4Problem)
                let listProblem = document.createElement("ol")

                allDownEvents.forEach((obj) => {
                    let li = document.createElement("li")
                    li.textContent = obj.element.toLowerCase() + " (Down-Event: " + obj.eventListeners + ")."
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

function displayDownEvents(event, downEvent, colors) {
    const checkbox = event.srcElement.checked
    const [primaryWarningColor, secondaryWarningColor, primaryProblemColor, secondaryProblemColor] = colors
    const marking = document.getElementById("marking").checked
    const warningsOnly = document.getElementById("warningsResult").checked
    const targetedElements = allDownEvents.filter(element => element.eventListeners === downEvent)
    if (checkbox) {
        // Add style and set display to inline for pointerAreas 
        // Only add stlye to warnings and unobservables if "marking" is checked 
        chrome.devtools.inspectedWindow.eval(`(function(){
            let elements = ${JSON.stringify(targetedElements)} 
            elements.forEach((obj) => {
                    let selector = '[data-downEventsFinder-id=' + obj.dataId + ']'
                    const element = document.querySelector(selector)
                    if (obj.state != "problem" && ${marking}){
                        let styleAttribute = 'border: 4px dashed ${primaryWarningColor} !important; outline: 4px dashed ${secondaryWarningColor} !important'
                        element.setAttribute("style", styleAttribute)
                    }
                    if(obj.state === "problem" && !${warningsOnly}){
                        let styleAttribute = 'outline: 5px solid ${primaryProblemColor} !important; border: 5px solid ${secondaryProblemColor} !important;'
                        element.setAttribute("style", styleAttribute)
                        let problemAreaElement = element.nextElementSibling
                        problemAreaElement.style.display = "inline"
                    }
            })
        })()`, (result, error) => {
            if (error) console.error("Error:", error)
        })
        console.log("Elements are visible")
    } else {
        chrome.devtools.inspectedWindow.eval(`(function(){
            let elements = ${JSON.stringify(targetedElements)} 
            elements.forEach((obj) => {
                    let selector = '[data-downEventsFinder-id=' + obj.dataId + ']'
                    const element = document.querySelector(selector)
                    element.setAttribute("style", "")
                    if(obj.state === "problem"){
                        let problemAreaElement = element.nextElementSibling
                        problemAreaElement.style.display = "none"
                    }
            })
        })()`, (result, error) => {
            if (error) console.error("Error:", error)
        })
    }
}

function displayFormMarkings(event, colors) {
    const checkbox = event.srcElement.checked
    const [primaryWarningColor, secondaryWarningColor, primaryProblemColor, secondaryProblemColor] = colors
    console.log("Form Results")
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
    }
}

function displayOnlyWarnings(event, colors) {
    const checkbox = event.srcElement.checked
    const [primaryWarningColor, secondaryWarningColor, primaryProblemColor, secondaryProblemColor] = colors
    const targetedElements = allDownEvents.filter(element => element.state === "problem")
    console.log(targetedElements)
    if (checkbox) {
        chrome.devtools.inspectedWindow.eval(`(function(){
            let elements = ${JSON.stringify(targetedElements)} 
            elements.forEach((obj) => {
                    let selector = '[data-downEventsFinder-id=' + obj.dataId + ']'
                    const element = document.querySelector(selector)
                    element.setAttribute("style", "")
                    if(obj.state === "problem"){
                        let problemAreaElement = element.nextElementSibling
                        problemAreaElement.style.display = "none"
                    }
            })
        })()`, (result, error) => {
            if (error) console.error("Error:", error)
        })
    } else {
        chrome.devtools.inspectedWindow.eval(`(function(){
            let elements = ${JSON.stringify(targetedElements)} 
            elements.forEach((obj) => {
                    let selector = '[data-downEventsFinder-id=' + obj.dataId + ']'
                    const element = document.querySelector(selector)
                    let styleAttribute = 'outline: 5px solid ${primaryProblemColor} !important; border: 5px solid ${secondaryProblemColor} !important;'
                    element.setAttribute("style", styleAttribute)
                    let problemAreaElement = element.nextElementSibling
                    problemAreaElement.style.display = "inline"
            })
        })()`, (result, error) => {
            if (error) console.error("Error:", error)
        })
    }
}