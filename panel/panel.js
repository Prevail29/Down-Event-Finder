let allDownEvents = undefined // Variable for all Down-Events
let testRan = false // Boolean if test already ran once on website

// Add event listeners to buttons and checkboxes
document.getElementById("initiateButton").addEventListener("click", initiateTest)
document.getElementById("iterateHighlightButton").addEventListener("click", iterativelyHighlightElements)
document.getElementById("abortSlowTest").addEventListener("click", abortSlowTest)
document.getElementById("abortHighlighting").addEventListener("click", abortHighlighting)
document.getElementById("slow").addEventListener("click", showTestingSpeed)
document.getElementById("checkAll").addEventListener("click", checkAllFilter)

document.getElementById("problemResult").addEventListener("click", displayResults)
document.getElementById("warningResult").addEventListener("click", displayResults)
document.getElementById("unobservableResult").addEventListener("click", displayResults)
document.getElementById("mousedownResults").addEventListener("click", displayResults)
document.getElementById("pointerdownResults").addEventListener("click", displayResults)
document.getElementById("touchstartResults").addEventListener("click", displayResults)

document.getElementById("formResults").addEventListener("click", displayFormMarkings)

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

// Get color values from panel
function getColors() {
    let colorWarningP = document.getElementById("primaryWarningColor").value
    let colorWarningS = document.getElementById("secondaryWarningColor").value
    let colorProblemP = document.getElementById("primaryProblemColor").value
    let colorProblemS = document.getElementById("secondaryProblemColor").value
    let highlightBackgroundColor = document.getElementById("highlightBackgroundColor").value
    let highlightBorderColor = document.getElementById("highlightBorderColor").value
    return [colorWarningP, colorWarningS, colorProblemP, colorProblemS, highlightBackgroundColor, highlightBorderColor]
}

// Get slow test values from panel
function getSlowValues() {
    let speed = document.getElementById("speed").value
    let checkbox = document.getElementById("slow").checked
    return [checkbox, speed]
}

// Get filter values from panel
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

// Get all down-events
function initiateTest() {
    if (!testRan) {
        // Retrieve all down-events from website
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
                    let elementId = 'DownEventFinder-' + id
                    element.setAttribute("data-downEventFinder-id", elementId)
                    downEvents.push({ downEvent: eventListeners, elementId: elementId})
                    id++
                }
            })
            return downEvents
        })()`, (result, error) => {
            testRan = true
            if (result.length > 0) executeTest(result)
            else {
                let h3 = document.createElement("h3")
                let resultNode = document.getElementById("testResults")
                h3.textContent = "This website does not have any down-events!"
                resultNode.appendChild(h3)
                setVisibility(document.getElementById("results"), true)
                disableButton(document.getElementById("initiateButton"), true)
            }
        })
    } else {
        let testRanStatus = document.getElementById("testRanStatus")
        testRanStatus.textContent = "Test already ran!"
        setTimeout(() => {
            testRanStatus.textContent = ''
        }, 3000)
    }
}

// Add script to catch window.open
function preventWindowOpen() {
    chrome.devtools.inspectedWindow.eval(`(function(){
        if (!document.getElementById("windowOpenBlockingDownEventFinder")){
            let script = document.createElement("script")
            script.setAttribute("id", "windowOpenBlockingDownEventFinder")
            script.textContent = \`window.open = function (url, target, windowFeatures) {
                let p = document.createElement("p")
                p.setAttribute("data-downEventFinder-windowOpen", "")
                p.style.display = "none"
                document.body.appendChild(p)
            }\`
            document.head.prepend(script)
        }
    })()`)
}

// Test website for changes 
function executeTest(downEvents) {
    disableButton(document.getElementById("initiateButton"), true)
    preventWindowOpen()
    if (document.getElementById("slow").checked) setVisibility(document.getElementById("abortSlowTest"), true)
    chrome.scripting.executeScript({
        target: { tabId: chrome.devtools.inspectedWindow.tabId },
        files: ["./scripts/test_website.js"]
    }, () => {
        chrome.scripting.executeScript({
            target: { tabId: chrome.devtools.inspectedWindow.tabId },
            args: [getFilter(), getSlowValues(), getColors(), downEvents],
            func: (...args) => testWebsite(...args)
        }).then((results) => {
            if (document.getElementById("slow").checked) setVisibility(document.getElementById("abortSlowTest"), false)
            if (!results[0].result) return
            const elementsWithDownEventsLength = downEvents.length
            const eventListenersSum = downEvents.map(({ downEvent }) => downEvent).flat().length
            const formsChanged = results[0].result.formsChanged
            const changedFormElements = results[0].result.changedFormElements
            const unobservableDownEvents = results[0].result.unobservableDownEvents
            const warningDownEvents = results[0].result.warningDownEvents
            const problemDownEvents = results[0].result.problemDownEvents
            const totalDownEvents = unobservableDownEvents.length + warningDownEvents.length + problemDownEvents.length
            allDownEvents = unobservableDownEvents.concat(warningDownEvents, problemDownEvents)

            let resultNode = document.getElementById("testResults")
            let h3 = document.createElement("h3")
            h3.textContent = `This Website has ${elementsWithDownEventsLength} element${elementsWithDownEventsLength === 1 ? "" : "s"} causing 
                                  ${totalDownEvents} down-event${totalDownEvents === 1 ? "" : "s"}.`
            resultNode.appendChild(h3)
            setVisibility(document.getElementById("results"), true)

            let paragraphNotice = document.createElement("p")
            paragraphNotice.textContent = "Notice: iFrame and shadow DOM down-events are not being detected."
            resultNode.appendChild(paragraphNotice)

            if (formsChanged) {
                let detailsForm = document.createElement("details")
                detailsForm.id = ("resultsForm")
                detailsForm.setAttribute("open", "")
                let summaryForm = document.createElement("summary")
                let formList = document.createElement("ol")
                summaryForm.textContent = "Form Elements changed!"
                resultNode.appendChild(detailsForm)
                detailsForm.append(summaryForm, formList)
                changedFormElements.forEach((obj) => {
                    let li = document.createElement("li")
                    li.textContent = obj.tagName
                    if (obj.tagName === "input") li.textContent += " (File Type: " + obj.type + ")"
                    li.addEventListener("click", () => {
                        chrome.devtools.inspectedWindow.eval(`(function(){
                                const element = document.querySelector('[data-downEventFinder-form-id=${obj.formId}]')
                                inspect(element)
                                element.scrollIntoView()})()`, (result, error) => {
                            if (error) {
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

            let detailsUnobservable = document.createElement("details")
            detailsUnobservable.id = "resultsUnobservable"
            let summaryUnobservable = document.createElement("summary")
            summaryUnobservable.textContent = `${unobservableDownEvents.length} down-event${unobservableDownEvents.length === 1 ? " was" : "s were"} unobservable`
            detailsUnobservable.appendChild(summaryUnobservable)
            let listUnobservable = document.createElement("ol")
            if (unobservableDownEvents.length > 0) detailsUnobservable.setAttribute("open", "")

            let detailsWarning = document.createElement("details")
            detailsWarning.id = "resultsWarning"
            let summaryWarning = document.createElement("summary")
            summaryWarning.textContent = `${warningDownEvents.length} down-event${warningDownEvents.length === 1 ? "" : "s"} caused minor changes`
            detailsWarning.appendChild(summaryWarning)
            let listWarning = document.createElement("ol")
            if (warningDownEvents.length > 0) detailsWarning.setAttribute("open", "")

            let detailsProblem = document.createElement("details")
            detailsProblem.id = "resultsProblem"
            let summaryProblem = document.createElement("summary")
            summaryProblem.textContent = `${problemDownEvents.length} down-event${problemDownEvents.length === 1 ? "" : "s"} caused major changes`
            detailsProblem.appendChild(summaryProblem)
            let listProblem = document.createElement("ol")
            if (problemDownEvents.length > 0) detailsProblem.setAttribute("open", "")

            allDownEvents.forEach((obj) => {
                let li = document.createElement("li")
                li.classList.add("resultListEntry")
                let trimmedId = obj.elementId.replace(/\D/g, "")
                li.textContent = obj.element.toLowerCase() + " (Down-Event: " + obj.eventListener + "; Element-ID: " + trimmedId + ")."
                if (!obj.visibility) {
                    let invisibleHintText = document.createElement("b")
                    invisibleHintText.textContent = ' Element has "display:none".'
                    li.appendChild(invisibleHintText)
                }
                if (obj.canBeFound === false) {
                    let notExisitingText = document.createElement("b")
                    notExisitingText.textContent += ' Element is not in DOM!'
                    notExisitingText.style.color = "red"
                    li.appendChild(notExisitingText)
                }
                li.addEventListener("click", () => {
                    chrome.devtools.inspectedWindow.eval(`(function(){
                                const element = document.querySelector('[data-downEventFinder-id=${obj.elementId}]')
                                inspect(element)
                                element.scrollIntoView()})()`, (result, error) => {
                        if (error) {
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

            let pZero = document.createElement("p")
            pZero.textContent = "No down-events in this category."

            if (unobservableDownEvents.length > 0) detailsUnobservable.appendChild(listUnobservable)
            else detailsUnobservable.appendChild(pZero.cloneNode(true))

            if (warningDownEvents.length > 0) detailsWarning.appendChild(listWarning)
            else detailsWarning.appendChild(pZero.cloneNode(true))

            if (problemDownEvents.length > 0) detailsProblem.appendChild(listProblem)
            else detailsProblem.appendChild(pZero.cloneNode(true))

            resultNode.append(detailsUnobservable, detailsWarning, detailsProblem)

            if (problemDownEvents.length > 0) createProblemBoxes(problemDownEvents)
            displayResults()
            if (formsChanged) displayFormMarkings()
        })
    })
}

// Create Boxes detailing additional information for problem elements
function createProblemBoxes(problemDownEvents) {
    chrome.scripting.executeScript({
        target: { tabId: chrome.devtools.inspectedWindow.tabId },
        files: ["./scripts/create_boxes.js"]
    }, () => {
        chrome.scripting.executeScript({
            target: { tabId: chrome.devtools.inspectedWindow.tabId },
            args: [problemDownEvents],
            func: (...args) => createProblemBoxes(...args)
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
    let groupedDownEvents = Object.groupBy(allDownEvents, ({ elementId }) => elementId)
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
    const checkboxFormResults = document.getElementById("formResults").checked
    let resultsForm = document.getElementById("resultsForm")
    chrome.scripting.executeScript({
        target: { tabId: chrome.devtools.inspectedWindow.tabId },
        files: ["./scripts/display_results.js"]
    }, () => {
        chrome.scripting.executeScript({
            target: { tabId: chrome.devtools.inspectedWindow.tabId },
            args: [getColors(), checkboxFormResults],
            func: (...args) => displayFormResults(...args)
        }).then((results) => {
            setVisibility(resultsForm, checkboxFormResults)
        })
    })
}

// Iteratively highlight elements
async function iterativelyHighlightElements() {
    const [primaryWarningColor, secondaryWarningColor, primaryProblemColor, secondaryProblemColor, highlightBackgroundColor, highlightBorderColor] = getColors()
    disableButton(document.getElementById("iterateHighlightButton"), true)
    setVisibility(document.getElementById("abortHighlighting"), true)
    chrome.scripting.executeScript({
        target: { tabId: chrome.devtools.inspectedWindow.tabId },
        files: ["./scripts/iterative_highlight.js"]
    }, () => {
        chrome.scripting.executeScript({
            target: { tabId: chrome.devtools.inspectedWindow.tabId },
            args: [highlightBackgroundColor, highlightBorderColor],
            func: (...args) => iterativelyHighlightElements(...args)
        }).then((results) => {
            if (results.result) {
                displayResults()
                disableButton(document.getElementById("iterateHighlightButton"), false)
                setVisibility(document.getElementById("abortHighlighting"), false)
            }
        })
    })
}

function abortSlowTest() {
    chrome.scripting.executeScript({
        target: { tabId: chrome.devtools.inspectedWindow.tabId },
        files: ["./scripts/test_website.js"]
    }, () => {
        chrome.scripting.executeScript({
            target: { tabId: chrome.devtools.inspectedWindow.tabId },
            func: () => abortSlowTest()
        }).then(() => {
            disableButton(document.getElementById("initiateButton"), false)
            testRan = false
        })
    })
}

function abortHighlighting() {
    chrome.scripting.executeScript({
        target: { tabId: chrome.devtools.inspectedWindow.tabId },
        files: ["./scripts/iterative_highlight.js"]
    }, () => {
        chrome.scripting.executeScript({
            target: { tabId: chrome.devtools.inspectedWindow.tabId },
            func: () => abortHighlighting()
        })
    })
}

// Reload Extension after tab update
let timeoutID = []
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status == "loading") {
        timeoutID.push(setTimeout(setReloadMessage, 1000, "Extension is reloading!"))
        console.log("Loading:", timeoutID)
    }
    if (changeInfo.status == "complete") {
        allDownEvents = undefined
        testRan = false
        timeoutID.forEach((timeout) => clearTimeout(timeout))
        setReloadMessage("")
        console.log("Complete:", timeoutID)
        let testRanStatus = document.getElementById("testRanStatus")
        testRanStatus.textContent = ""
        let testResults = document.getElementById("testResults")
        setVisibility(document.getElementById("results"), false)
        disableButton(document.getElementById("initiateButton"), false)
        if (testResults.hasChildNodes()) document.getElementById("testResults").replaceChildren()
        chrome.devtools.inspectedWindow.eval(`(function(){
            let stylingElement = document.getElementById("styleElementDownEventFinder")
            let problemBoxes = document.querySelectorAll(".problemInfoBox")
            if (stylingElement) stylingElement.remove()
            if (problemBoxes) problemBoxes.forEach((element) => element.remove())
        })()`)
        timeoutID = []
    }
})

function disableButton(button, condition) {
    if (condition) {
        button.setAttribute("disabled", "")
        button.classList.add("disabledButton")
    } else {
        button.removeAttribute("disabled")
        button.classList.remove("disabledButton")
    }
}

function setReloadMessage(message) {
    document.getElementById("reloadStatus").textContent = message
}