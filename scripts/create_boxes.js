function createProblemBoxes(problemDownEvents) {
    let problemMessages = []
    problemDownEvents.forEach(obj => {
        const element = document.querySelector(`[data-downeventsfinder-id='${obj.dataId}']`)
        const eventListener = obj.eventListener
        problemMessages.push(obj.problemMessage)
        createBox(element, eventListener)
    })
    createInformation(problemMessages)
}

// Function for creating problem box and info
function createBox(element, eventListener) {
    const shadowContainerBox = document.createElement("div")
    shadowContainerBox.classList.add("problemInfoBox")
    shadowContainerBox.style.display = "inline-block"
    
    // Create problem box
    let symbol = document.createElement("span")
    symbol.textContent = "\u2755"
    symbol.style.paddingRight = "5px"
    symbol.style.fontSize = "small"

    let pEvent = document.createElement("span")
    pEvent.textContent = `Problem: ${eventListener} event observed`
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
    divBox.style.display = "inline-block"
    divBox.style.position = "relative"
    divBox.style.textDecorationLine = "none"
    divBox.style.cursor = "default"

    let button = document.createElement("button")
    button.classList.add("infoButton")
    button.textContent = "\u2139"
    button.style.borderRadius = "50%"
    button.style.marginLeft = "5px"
    button.style.padding = "1px 6px"
    button.style.backgroundColor = "lightgrey"
    button.style.cursor = "pointer"

    divBox.appendChild(symbol)
    divBox.appendChild(pEvent)
    divBox.appendChild(button)
    // Prevent hyperlinks from activating
    divBox.addEventListener("click", (event) => event.preventDefault())

    // Add Shadow Dom after problem element
    if (element) element.after(shadowContainerBox)
    const shadowBox = shadowContainerBox.attachShadow({ mode: "open" })
    shadowBox.appendChild(divBox)
}

// Create additional information text 
function createInformation(problemMessages) {
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

    // Event handler for info button
    let z = 0
    for (const { shadowRoot } of document.querySelectorAll("div.problemInfoBox")) {
        let button = shadowRoot.querySelector("div button.infoButton")
        let problemList = document.createElement("ul")
        problemList.style.fontFamily = "Arial"
        problemList.style.fontSize = "small"
        problemList.classList.add("problemInfoBoxText")
        problemMessages[z].forEach((text) => {
            let problemText = document.createElement("li")
            problemText.textContent = text
            problemList.appendChild(problemText)
        })
        button.addEventListener("click", (event) => {
            if (divHelp.querySelectorAll(".problemInfoBoxText").length != 0) {
                divHelp.querySelectorAll(".problemInfoBoxText").forEach((element) => element.remove())
            }
            if (divHelp.style.display == "none") {
                divHelp.prepend(problemList)
                divHelp.style.display = "block"
                divHelp.style.left = (button.parentNode.getBoundingClientRect().right + window.scrollX) + "px"
                divHelp.style.top = (button.parentNode.getBoundingClientRect().bottom + window.scrollY) + "px"
            } else if (divHelp.style.display == "block") {
                divHelp.style.display = "none"
            }
            event.preventDefault()
        })
        z++
    }
    document.body.appendChild(shadowContainerHelp)
    const shadowHelp = shadowContainerHelp.attachShadow({ mode: "open" })
    shadowHelp.appendChild(divHelp)
}