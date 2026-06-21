function extractProblem() {
    const scriptTag = document.getElementById('__NEXT_DATA__')
    
    if (!scriptTag) {
        console.log("__NEXT_DATA__ not found, retrying...")
        setTimeout(extractProblem, 1000)
        return
    }

    const data = JSON.parse(scriptTag.textContent)
    const queries = data.props.pageProps.dehydratedState.queries
    const questionData = queries.find(q => q.state.data && q.state.data.question)

    if (!questionData) {
        console.log("Question not found in queries")
        return
    }

    const question = questionData.state.data.question
    const title = question.title
    const difficulty = question.difficulty
    const content = question.content

    console.log("DO-IT-YOURSELF detected:", title, difficulty)

    chrome.storage.local.set({
        currentProblem: {
            title: title,
            difficulty: difficulty,
            content: content
        },
        onLeetCode: true
    }, function() {
        console.log("Problem saved to storage:", title)
    })

    window.addEventListener("beforeunload", function() {
        chrome.storage.local.set({ onLeetCode: false })
    })
}

extractProblem()