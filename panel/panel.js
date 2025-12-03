let allDownEvents = undefined

// Add event listeners to buttons
document.getElementById("initiateButton").addEventListener("click", getDownEventElements)
document.getElementById("iterateHighlightButton").addEventListener("click", iterativelyHighlightElements)
document.getElementById("slow").addEventListener("click", showTestingSpeed)
document.getElementById("checkAll").addEventListener("click", checkAllFilter)

document.getElementById("problemResult").addEventListener("click", displayResults)
document.getElementById("warningResult").addEventListener("click", displayResults)
document.getElementById("unobservableResult").addEventListener("click", displayResults)
document.getElementById("mousedownResults").addEventListener("click", displayResults)
document.getElementById("pointerdownResults").addEventListener("click", displayResults)
document.getElementById("touchstartResults").addEventListener("click", displayResults)

document.getElementById("formResults").addEventListener("click", displayFormMarkings)

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

// Change the visibility of an element
function setVisibility(element, condition) {
    if (condition) element.classList.remove("hidden")
    else element.classList.add("hidden")
}

// Show the testing speed for slow speed
function showTestingSpeed() {
    let checkbox = document.getElementById("slow").checked
    let testingSpeedField = document.querySelector(".behavior div")
    setVisibility(testingSpeedField, checkbox)
}

// Function for checking / unchecking all filters at once 
function checkAllFilter() {
    let allFilter = document.querySelectorAll('.filter input:not([id*="checkAll"])')
    if (document.getElementById("checkAll").checked) {
        allFilter.forEach((checkbox) => checkbox.checked = true)
    } else {
        allFilter.forEach((checkbox) => checkbox.checked = false)
    }
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
                // console.log("Results:", result)
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
        files: ["./scripts/test_website.js"]
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
            /*
            console.log("Unobservable Down-Events: ", unobservableDownEvents)
            console.log("Warning Down-Events: ", warningDownEvents)
            console.log("Problem Down-Events: ", problemDownEvents)
            */
            let resultNode = document.getElementsByClassName("testResults")[0]
            let h3 = document.createElement("h3")

            if (elementsWithDownEventsLength === 0 || elementsWithDownEventsLength == undefined) {
                h3.textContent = "Website does not have any down-events!"
                resultNode.appendChild(h3)
            } else {
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

// Change how results are displayed
function displayResults() {
    const checkboxProblem = document.getElementById("problemResult").checked
    const checkboxWarning = document.getElementById("warningResult").checked
    const checkboxUnobservable = document.getElementById("unobservableResult").checked
    const checkboxMousedown = document.getElementById("mousedownResults").checked
    const checkboxPointerdown = document.getElementById("pointerdownResults").checked
    const checkboxTouchstart = document.getElementById("touchstartResults").checked
    let groupedDownEvents = Object.groupBy(allDownEvents, ({ dataId }) => dataId)
    chrome.scripting.executeScript({
        target: { tabId: chrome.devtools.inspectedWindow.tabId },
        files: ["./scripts/display_results.js"]
    }, () => {
        chrome.scripting.executeScript({
            target: { tabId: chrome.devtools.inspectedWindow.tabId },
            args: [getColors(), groupedDownEvents,
            [checkboxProblem, checkboxWarning, checkboxUnobservable,
                checkboxMousedown, checkboxPointerdown, checkboxTouchstart]],
            func: (...args) => displayResults(...args)
        }).then((results) => {
            const resultListEntries = document.querySelectorAll(".resultListEntry")
            setVisibility(document.getElementById("resultsProblem"), checkboxProblem)
            setVisibility(document.getElementById("resultsWarning"), checkboxWarning)
            setVisibility(document.getElementById("resultsUnobservable"), checkboxUnobservable)
            resultListEntries.forEach((obj) => {
                let string = obj.innerHTML.match(/touchstart|pointerdown|mousedown/)[0]
                switch (string) {
                    case "touchstart":
                        setVisibility(obj, checkboxTouchstart)
                        break;
                    case "pointerdown":
                        setVisibility(obj, checkboxPointerdown)
                        break;
                    case "mousedown":
                        setVisibility(obj, checkboxMousedown)
                        break;
                }
            })
        })
    })
}

// Change the visibility of form markings
function displayFormMarkings() {
    const checkboxFormResults = document.getElementById("formResults")
    const [primaryWarningColor, secondaryWarningColor, primaryProblemColor, secondaryProblemColor] = getColors()
    let changedFormsList = document.getElementById("changedFormsList")
    if (changedFormsList) {
        if (checkboxFormResults.checked) {
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

}

// Iteratively highlight elements
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
        if (error) console.error("Error:", error)
    })
}